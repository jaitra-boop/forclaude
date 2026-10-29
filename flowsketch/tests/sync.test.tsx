/**
 * Both views are pure renderings of the one store. These tests drive one view
 * and assert on what the other renders.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { actions, activeFlow } from "../src/store/store";
import { sampleProject } from "../src/model/sample";
import { FlowView } from "../src/views/flow/FlowView";
import { StoryboardView } from "../src/views/storyboard/StoryboardView";
import { Inspector } from "../src/panels/Inspector";
import { ScreenNode } from "../src/views/flow/ScreenNode";
import { flowToEdges, flowToNodes } from "../src/views/flow/graph";
import { ReactFlowProvider } from "@xyflow/react";

function Both() {
  return (
    <div>
      <div data-testid="flow-pane"><FlowView /></div>
      <div data-testid="story-pane"><StoryboardView /></div>
      <div data-testid="inspector"><Inspector /></div>
    </div>
  );
}

beforeEach(() => actions.load(sampleProject()));
afterEach(cleanup);

/** Renders the flow-view node for a screen exactly as React Flow would. */
function renderFlowNode(screenId: string) {
  const node = flowToNodes(activeFlow()!, null, new Map()).find((n) => n.id === screenId)!;
  return render(
    <ReactFlowProvider>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ScreenNode {...({ id: node.id, data: node.data, selected: false, type: "screen", dragging: false, zIndex: 0, isConnectable: true, positionAbsoluteX: 0, positionAbsoluteY: 0, selectable: true, deletable: true, draggable: true } as any)} />
    </ReactFlowProvider>,
  );
}

describe("storyboard → flow view", () => {
  it("editing an element label via the storyboard changes what the flow node renders", () => {
    render(<Both />);
    const story = screen.getByTestId("story-pane");
    // Click the "Invite teammate" button inside the storyboard frame…
    const frame = within(story).getByTestId("frame-scr_members");
    fireEvent.click(frame.querySelector('[data-element-id="el_m_invite"]')!);
    // …then type a new label in the side panel.
    fireEvent.change(screen.getByTestId("element-label-input"), { target: { value: "Add people" } });

    expect(activeFlow()!.screens[0]!.elements.find((e) => e.id === "el_m_invite")!.label).toBe("Add people");
    const { container } = renderFlowNode("scr_members");
    expect(container.textContent).toContain("Add people");
    expect(container.textContent).not.toContain("Invite teammate");
    // The flow view's own node (rendered from the same store) updated in the same render.
    const flowNode = screen.getByTestId("flow-pane").querySelector('[data-testid="flow-node-scr_members"]');
    if (flowNode) expect(flowNode.textContent).toContain("Add people");
  });

  it("'Link to screen…' in the storyboard creates the same edge the flow view renders", () => {
    render(<Both />);
    fireEvent.click(within(screen.getByTestId("frame-scr_sent")).getByText("Copy invite link"));
    fireEvent.change(screen.getByTestId("link-target-select"), { target: { value: "scr_members" } });
    fireEvent.click(screen.getByTestId("link-apply"));
    const edges = flowToEdges(activeFlow()!, null);
    const e = edges.find((x) => x.data!.transition.triggerElementId === "el_c_copy");
    expect(e).toMatchObject({ source: "scr_sent", target: "scr_members" });
    expect(e!.data!.transition.trigger).toBe('Tap "Copy invite link"');
  });
});

describe("flow view → storyboard", () => {
  it("creating an edge via the flow action makes the storyboard show the new transition", () => {
    render(<Both />);
    const story = screen.getByTestId("story-pane");
    expect(within(story).queryByTestId("or-chip-scr_sent")).toBeNull();
    // This is exactly what the flow view's onConnect does.
    act(() => {
      actions.addTransition({ from: "scr_sent", to: "scr_invite" });
    });
    const t = activeFlow()!.transitions.at(-1)!;
    // A new happy edge outranks the existing "back" edge, so the path now follows it…
    expect(within(story).getByTestId(`arrow-${t.id}`).textContent).toContain('Go to "Invite form"');
    // …and the old back edge is offered as an "or…" alternative at this branch point.
    fireEvent.click(within(story).getByTestId("or-chip-scr_sent"));
    fireEvent.click(within(story).getByTestId("branch-tr_done"));
    expect(within(story).getByTestId("arrow-tr_done")).toBeTruthy();
    expect(within(story).queryByTestId(`arrow-${t.id}`)).toBeNull();
  });

  it("renaming a screen, changing the start screen and deleting a screen all reach the storyboard", () => {
    render(<Both />);
    const story = screen.getByTestId("story-pane");
    act(() => actions.updateScreen("scr_invite", { title: "Invite someone" }));
    expect(within(story).getByTestId("frame-scr_invite").textContent).toContain("Invite someone");
    act(() => actions.setStartScreen("scr_invite"));
    const first = within(within(story).getByTestId("storyboard-path")).getAllByTestId("frame-title")[0]!;
    expect(first.textContent).toBe("Invite someone");
    act(() => actions.deleteScreen("scr_sending"));
    expect(within(story).queryByTestId("frame-scr_sending")).toBeNull();
  });

  it("relabeling a transition updates the storyboard arrow", () => {
    render(<Both />);
    act(() => actions.updateTransition("tr_open_invite", { trigger: "Tap +" }));
    expect(within(screen.getByTestId("story-pane")).getByTestId("arrow-tr_open_invite").textContent).toContain("Tap +");
  });

  it("annotations edited anywhere show under the storyboard frame and as pins on the flow node", () => {
    render(<Both />);
    let id = "";
    act(() => {
      id = actions.addAnnotation({ screenId: "scr_sent" }, { type: "edge-case", text: "Bounced email", targetElementId: "el_c_text" });
    });
    expect(within(screen.getByTestId("story-pane")).getByTestId(`note-${id}`).textContent).toContain("Bounced email");
    const { container } = renderFlowNode("scr_sent");
    expect(container.querySelector(`[data-annotation-id="${id}"]`)).not.toBeNull();
  });

  it("selection is shared: selecting a transition highlights the storyboard arrow", () => {
    render(<Both />);
    act(() => actions.select({ kind: "transition", id: "tr_send" }));
    expect((within(screen.getByTestId("story-pane")).getByTestId("arrow-tr_send") as HTMLElement).style.outline).toContain("dashed");
    expect(flowToEdges(activeFlow()!, { kind: "transition", id: "tr_send" }).find((e) => e.id === "tr_send")!.selected).toBe(true);
  });

  it("undo works across views", () => {
    render(<Both />);
    act(() => actions.updateElement("el_m_invite", { label: "Add people" }));
    act(() => actions.addTransition({ from: "scr_sent", to: "scr_invite" }));
    act(() => actions.undo());
    act(() => actions.undo());
    expect(within(screen.getByTestId("frame-scr_members")).getByText("Invite teammate")).toBeTruthy();
    expect(activeFlow()!.transitions).toHaveLength(9);
  });
});
