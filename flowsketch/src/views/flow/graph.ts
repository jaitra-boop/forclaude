/**
 * Pure derivation of React Flow nodes/edges from the model. The flow view keeps
 * no copy of screens or transitions; it re-derives these on every store change.
 */
import { MarkerType } from "@xyflow/react";
import type { Flow } from "../../model/schema";
import type { Selection } from "../../store/store";
import type { ScreenNodeType } from "./ScreenNode";
import type { TransitionEdgeType } from "./TransitionEdge";

export function flowToNodes(flow: Flow, selection: Selection, measured: Map<string, { width: number; height: number }>): ScreenNodeType[] {
  return flow.screens.map((screen) => {
    const containsSelection =
      (selection?.kind === "element" && selection.screenId === screen.id) ||
      (selection?.kind === "annotation" && selection.screenId === screen.id);
    const node: ScreenNodeType = {
      id: screen.id,
      type: "screen",
      position: screen.position,
      selected: selection?.kind === "screen" && selection.id === screen.id,
      data: { screen, platform: flow.platform, isStart: flow.startScreenId === screen.id, containsSelection },
    };
    const m = measured.get(screen.id);
    if (m) node.measured = m;
    return node;
  });
}

export function flowToEdges(flow: Flow, selection: Selection): TransitionEdgeType[] {
  const pairCount = new Map<string, number>();
  const pos = new Map(flow.screens.map((s) => [s.id, s.position]));
  return flow.transitions.map((t) => {
    const from = pos.get(t.from);
    const to = pos.get(t.to);
    const underneath = t.from !== t.to && (t.kind === "back" || (from && to && to.x < from.x - 10));
    const key = [t.from, t.to].sort().join("|");
    const parallelIndex = pairCount.get(key) ?? 0;
    pairCount.set(key, parallelIndex + 1);
    return {
      id: t.id,
      type: "transition",
      source: t.from,
      target: t.to,
      sourceHandle: underneath ? "bs" : "r",
      targetHandle: underneath ? "bt" : "l",
      selected: selection?.kind === "transition" && selection.id === t.id,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#1c1c1c", width: 16, height: 16 },
      data: { transition: t, parallelIndex, selfLoop: t.from === t.to },
    };
  });
}
