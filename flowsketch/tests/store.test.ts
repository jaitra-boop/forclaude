import { beforeEach, describe, expect, it } from "vitest";
import { actions, activeFlow, useStore } from "../src/store/store";
import { sampleProject } from "../src/model/sample";
import { checkProjectIntegrity } from "../src/model/integrity";

const flow = () => activeFlow()!;
const screen = (id: string) => flow().screens.find((s) => s.id === id)!;

beforeEach(() => actions.load(sampleProject()));

describe("store actions", () => {
  it("loads the sample with the first flow active", () => {
    expect(useStore.getState().activeFlowId).toBe("fl_invite");
    expect(flow().screens).toHaveLength(6);
  });

  it("add / rename / duplicate / delete screens", () => {
    const id = actions.addScreen({ title: "Settings" });
    expect(screen(id).title).toBe("Settings");
    actions.updateScreen(id, { title: "Workspace settings" });
    expect(screen(id).title).toBe("Workspace settings");
    const copy = actions.duplicateScreen("scr_invite");
    expect(screen(copy).elements).toHaveLength(screen("scr_invite").elements.length);
    expect(screen(copy).elements.every((e) => e.linkTo === undefined)).toBe(true);
    expect(useStore.getState().selection).toEqual({ kind: "screen", id: copy });
    actions.deleteScreen(copy);
    expect(flow().screens.some((s) => s.id === copy)).toBe(false);
    expect(useStore.getState().selection).toBeNull();
    expect(checkProjectIntegrity(useStore.getState().project)).toEqual([]);
  });

  it("element add / edit / move / delete", () => {
    const id = actions.addElement("scr_invite", "checkbox", 2);
    expect(screen("scr_invite").elements[2]!.id).toBe(id);
    actions.updateElement(id, { label: "Send me a copy" });
    expect(screen("scr_invite").elements[2]!.label).toBe("Send me a copy");
    actions.moveElement(id, "scr_invite", 0);
    expect(screen("scr_invite").elements[0]!.id).toBe(id);
    actions.deleteElement(id);
    expect(screen("scr_invite").elements.some((e) => e.id === id)).toBe(false);
  });

  it("link to an existing screen and to a new screen", () => {
    const { transitionId } = actions.linkElementToScreen("el_c_copy", { screenId: "scr_members" });
    const t = flow().transitions.find((x) => x.id === transitionId)!;
    expect(t).toMatchObject({ from: "scr_sent", to: "scr_members", triggerElementId: "el_c_copy", trigger: 'Tap "Copy invite link"' });
    // Relinking reuses the same transition.
    const again = actions.linkElementToScreen("el_c_copy", { newScreenTitle: "Link copied" });
    expect(again.transitionId).toBe(transitionId);
    expect(screen(again.screenId).title).toBe("Link copied");
    expect(flow().transitions.find((x) => x.id === transitionId)!.to).toBe(again.screenId);
    expect(checkProjectIntegrity(useStore.getState().project)).toEqual([]);
  });

  it("transitions: add, relabel, change kind, delete", () => {
    const id = actions.addTransition({ from: "scr_sent", to: "scr_invite", trigger: "Invite another" });
    actions.updateTransition(id, { trigger: 'Tap "Invite another"', kind: "alternate" });
    expect(flow().transitions.find((t) => t.id === id)).toMatchObject({ trigger: 'Tap "Invite another"', kind: "alternate" });
    actions.deleteTransition(id);
    expect(flow().transitions.some((t) => t.id === id)).toBe(false);
  });

  it("annotations: add, edit, delete", () => {
    const id = actions.addAnnotation({ screenId: "scr_sent" }, { type: "open-question", text: "Resend?", targetElementId: "el_c_copy" });
    expect(screen("scr_sent").annotations.at(-1)).toMatchObject({ id, targetElementId: "el_c_copy" });
    actions.updateAnnotation(id, { text: "Allow resend after 1 hour?" });
    expect(screen("scr_sent").annotations.at(-1)!.text).toBe("Allow resend after 1 hour?");
    const tid = actions.addAnnotation({ transitionId: "tr_send" }, { text: "Debounce double taps" });
    expect(flow().transitions.find((t) => t.id === "tr_send")!.annotations[0]!.id).toBe(tid);
    actions.deleteAnnotation(id);
    expect(screen("scr_sent").annotations.some((a) => a.id === id)).toBe(false);
  });

  it("set start screen", () => {
    actions.setStartScreen("scr_invite");
    expect(flow().startScreenId).toBe("scr_invite");
  });

  it("keyboard helpers: delete and duplicate the selection", () => {
    actions.select({ kind: "element", id: "el_m_search", screenId: "scr_members" });
    actions.duplicateSelection();
    expect(screen("scr_members").elements.filter((e) => e.type === "search")).toHaveLength(2);
    actions.select({ kind: "transition", id: "tr_seat_limit" });
    actions.deleteSelection();
    expect(flow().transitions.some((t) => t.id === "tr_seat_limit")).toBe(false);
    expect(useStore.getState().selection).toBeNull();
  });
});

describe("undo / redo", () => {
  it("undoes and redoes across different kinds of edits", () => {
    const before = useStore.getState().project;
    actions.updateElement("el_m_invite", { label: "Add people" });
    actions.deleteScreen("scr_seats");
    expect(flow().screens).toHaveLength(5);
    actions.undo();
    expect(flow().screens).toHaveLength(6);
    expect(flow().transitions.some((t) => t.id === "tr_seat_limit")).toBe(true);
    actions.undo();
    expect(useStore.getState().project).toEqual(before);
    actions.redo();
    expect(screen("scr_members").elements.find((e) => e.id === "el_m_invite")!.label).toBe("Add people");
    actions.redo();
    expect(flow().screens).toHaveLength(5);
  });

  it("a new edit clears the redo stack", () => {
    actions.updateScreen("scr_sent", { title: "Sent!" });
    actions.undo();
    actions.updateScreen("scr_sent", { purpose: "x" });
    actions.redo();
    expect(screen("scr_sent").title).toBe("Invite sent");
  });

  it("coalesces a drag into one undo step", () => {
    for (let i = 1; i <= 10; i++) actions.moveScreen("scr_sent", { x: 900 + i * 10, y: 0 });
    expect(screen("scr_sent").position.x).toBe(1000);
    expect(useStore.getState().past).toHaveLength(1);
    actions.undo();
    expect(screen("scr_sent").position.x).toBe(840);
  });

  it("coalesces typing in the same field, but not across fields", () => {
    for (const label of ["I", "In", "Inv"]) actions.updateElement("el_m_invite", { label });
    actions.updateScreen("scr_members", { title: "People" });
    expect(useStore.getState().past).toHaveLength(2);
    actions.undo();
    actions.undo();
    expect(screen("scr_members").elements.find((e) => e.id === "el_m_invite")!.label).toBe("Invite teammate");
  });

  it("failed ops leave the model and history untouched", () => {
    const before = useStore.getState().project;
    expect(() => actions.addTransition({ from: "scr_members", to: "ghost" })).toThrow();
    expect(useStore.getState().project).toBe(before);
    expect(useStore.getState().past).toHaveLength(0);
  });

  it("undo prunes a selection that no longer exists", () => {
    const id = actions.addScreen();
    expect(useStore.getState().selection).toEqual({ kind: "screen", id });
    actions.undo();
    expect(useStore.getState().selection).toBeNull();
  });
});
