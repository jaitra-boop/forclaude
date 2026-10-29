import { describe, expect, it } from "vitest";
import { produce } from "immer";
import { checkIntegrity, checkProjectIntegrity, repairFlow } from "../src/model/integrity";
import * as ops from "../src/model/ops";
import { sampleProject } from "../src/model/sample";
import type { Project } from "../src/model/schema";

const F = "fl_invite";
const run = (p: Project, fn: (d: Project) => void) => produce(p, fn);
const flow = (p: Project) => p.flows[0]!;

describe("reference integrity", () => {
  it("sample project is clean", () => {
    expect(checkProjectIntegrity(sampleProject())).toEqual([]);
  });

  it("deleting a screen removes its transitions and clears linkTo on other screens", () => {
    const p = run(sampleProject(), (d) => ops.deleteScreen(d, F, "scr_sending"));
    const f = flow(p);
    expect(f.screens.find((s) => s.id === "scr_sending")).toBeUndefined();
    expect(f.transitions.some((t) => t.from === "scr_sending" || t.to === "scr_sending")).toBe(false);
    // "Send invite" fired tr_send (to scr_sending) — its link must be gone.
    const send = f.screens.find((s) => s.id === "scr_invite")!.elements.find((e) => e.id === "el_i_send")!;
    expect(send.linkTo).toBeUndefined();
    expect(checkIntegrity(f)).toEqual([]);
  });

  it("deleting the start screen moves start to an existing screen", () => {
    const p = run(sampleProject(), (d) => ops.deleteScreen(d, F, "scr_members"));
    expect(flow(p).screens.some((s) => s.id === flow(p).startScreenId)).toBe(true);
    expect(checkIntegrity(flow(p))).toEqual([]);
  });

  it("deleting a transition clears the triggering element's linkTo", () => {
    const p = run(sampleProject(), (d) => ops.deleteTransition(d, F, "tr_open_invite"));
    const btn = flow(p).screens[0]!.elements.find((e) => e.id === "el_m_invite")!;
    expect(btn.linkTo).toBeUndefined();
    expect(checkIntegrity(flow(p))).toEqual([]);
  });

  it("deleting an element clears transition triggers and annotation pins", () => {
    let p = run(sampleProject(), (d) => ops.deleteElement(d, F, "el_m_invite"));
    expect(flow(p).transitions.find((t) => t.id === "tr_open_invite")!.triggerElementId).toBeUndefined();
    p = run(p, (d) => ops.deleteElement(d, F, "el_m_list"));
    expect(flow(p).screens[0]!.annotations.find((a) => a.id === "an_m1")!.targetElementId).toBeUndefined();
    expect(checkIntegrity(flow(p))).toEqual([]);
  });

  it("moving a linked element to another screen moves the transition source", () => {
    const p = run(sampleProject(), (d) => ops.moveElement(d, F, "el_m_invite", "scr_sent", 0));
    const t = flow(p).transitions.find((x) => x.id === "tr_open_invite")!;
    expect(t.from).toBe("scr_sent");
    expect(checkIntegrity(flow(p))).toEqual([]);
  });

  it("deleting a persona unassigns flows", () => {
    const p = run(sampleProject(), (d) => ops.deletePersona(d, "pe_priya"));
    expect(flow(p).personaId).toBe("");
    expect(checkProjectIntegrity(p)).toEqual([]);
  });

  it("detects and repairs every kind of dangling reference", () => {
    const f = structuredClone(flow(sampleProject()));
    f.startScreenId = "ghost";
    f.transitions.push({ id: "tr_x", from: "ghost", to: "scr_sent", trigger: "x", kind: "happy", annotations: [] });
    f.screens[0]!.elements[0]!.linkTo = "tr_missing";
    f.screens[0]!.annotations[0]!.targetElementId = "el_missing";
    f.transitions[0]!.triggerElementId = "el_c_done"; // element on a different screen
    const kinds = checkIntegrity(f).map((i) => i.kind).sort();
    expect(kinds).toEqual(expect.arrayContaining(["start-screen", "transition-from", "element-link", "annotation-target", "trigger-element"]));
    repairFlow(f);
    expect(checkIntegrity(f)).toEqual([]);
  });

  it("detects duplicate ids", () => {
    const f = structuredClone(flow(sampleProject()));
    f.screens[1]!.elements[0]!.id = f.screens[0]!.elements[0]!.id;
    expect(checkIntegrity(f).some((i) => i.kind === "duplicate-id")).toBe(true);
  });

  it("an element fires at most one transition", () => {
    const p = run(sampleProject(), (d) => {
      ops.addTransition(d, F, { from: "scr_members", to: "scr_sent", triggerElementId: "el_m_invite" });
    });
    const f = flow(p);
    expect(f.transitions.find((t) => t.id === "tr_open_invite")!.triggerElementId).toBeUndefined();
    expect(checkIntegrity(f)).toEqual([]);
  });
});
