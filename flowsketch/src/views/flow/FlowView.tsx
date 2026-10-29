import { useCallback, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { actions, activeFlow, useStore } from "../../store/store";
import { ScreenNode, type ScreenNodeType } from "./ScreenNode";
import { TransitionEdge } from "./TransitionEdge";
import { flowToEdges, flowToNodes } from "./graph";
import { exportFlowPng } from "../../export/png";

const nodeTypes = { screen: ScreenNode };
const edgeTypes = { transition: TransitionEdge };

function FlowCanvas() {
  const flow = useStore((s) => activeFlow(s));
  const selection = useStore((s) => s.selection);
  // View-only measurement cache required by React Flow; not model data.
  const [measured, setMeasured] = useState(() => new Map<string, { width: number; height: number }>());
  const rf = useReactFlow();

  const nodes = useMemo(() => (flow ? flowToNodes(flow, selection, measured) : []), [flow, selection, measured]);
  const edges = useMemo(() => (flow ? flowToEdges(flow, selection) : []), [flow, selection]);

  const onNodesChange = useCallback((changes: NodeChange<ScreenNodeType>[]) => {
    let nextMeasured: Map<string, { width: number; height: number }> | undefined;
    for (const c of changes) {
      if (c.type === "position" && c.position) actions.moveScreen(c.id, c.position);
      else if (c.type === "dimensions" && c.dimensions) {
        nextMeasured ??= new Map(measured);
        nextMeasured.set(c.id, c.dimensions);
      } else if (c.type === "select" && c.selected) actions.select({ kind: "screen", id: c.id });
    }
    if (nextMeasured) setMeasured(nextMeasured);
  }, [measured]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    for (const c of changes) if (c.type === "select" && c.selected) actions.select({ kind: "transition", id: c.id });
  }, []);

  const onConnect = useCallback((c: Connection) => {
    if (c.source && c.target) actions.addTransition({ from: c.source, to: c.target });
  }, []);

  if (!flow) return <EmptyState />;

  const addScreenAtCenter = () => {
    const el = document.querySelector(".fs-flow .react-flow");
    const rect = el?.getBoundingClientRect();
    const position = rect ? rf.screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }) : { x: 0, y: 0 };
    actions.addScreen({ position });
  };

  return (
    <div className="fs-flow relative h-full w-full">
      <div className="absolute left-3 top-3 z-10 flex gap-1.5">
        <button className="fs-btn" onClick={addScreenAtCenter}>+ Screen</button>
        <button className="fs-btn" onClick={() => { actions.autoLayout(); setTimeout(() => rf.fitView({ padding: 0.15 }), 0); }}>Auto-layout</button>
        <button className="fs-btn" onClick={() => rf.fitView({ padding: 0.15 })}>Fit</button>
        <button className="fs-btn" onClick={() => exportFlowPng(flow)}>PNG</button>
      </div>
      <div className="pointer-events-none absolute left-3 top-11 z-10 text-[10px] text-neutral-500">
        Drag from a node's dot to another node to add a transition · double-click to edit
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={(_, node) => actions.openEditor(node.id)}
        onPaneClick={() => actions.select(null)}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#c4c4c4" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor="#dedede" nodeStrokeColor="#474747" maskColor="rgba(240,240,240,0.7)" />
      </ReactFlow>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center text-sm text-neutral-500">
      No flow yet. Generate one from the Ideate panel, or load the sample.
    </div>
  );
}

export function FlowView() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
