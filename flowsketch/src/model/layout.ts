/**
 * Left-to-right auto-layout with dagre. Only touches screen.position, which only
 * the flow view reads.
 */
import dagre from "@dagrejs/dagre";
import type { Flow, Platform, Position } from "./schema";

/** Flow-view node footprint (thumbnail + title), shared with the flow node renderer. */
export function nodeSize(platform: Platform): { width: number; height: number } {
  return platform === "mobile" ? { width: 190, height: 380 } : { width: 300, height: 250 };
}

export function autoLayout(flow: Flow): Record<string, Position> {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: "LR", nodesep: 70, ranksep: 140, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  const { width, height } = nodeSize(flow.platform);
  for (const s of flow.screens) g.setNode(s.id, { width, height });
  for (const t of flow.transitions) {
    // Back edges shouldn't pull targets rightward; lay out against forward edges only.
    if (t.kind === "back") continue;
    if (g.hasNode(t.from) && g.hasNode(t.to)) g.setEdge(t.from, t.to, { weight: t.kind === "happy" ? 3 : 1 }, t.id);
  }
  dagre.layout(g);
  const out: Record<string, Position> = {};
  for (const s of flow.screens) {
    const n = g.node(s.id);
    if (n) out[s.id] = { x: Math.round(n.x - width / 2), y: Math.round(n.y - height / 2) };
  }
  return out;
}
