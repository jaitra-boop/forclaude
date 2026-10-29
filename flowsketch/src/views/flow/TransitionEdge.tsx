import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";
import type { Transition, TransitionKind } from "../../model/schema";
import { actions } from "../../store/store";

export type TransitionEdgeData = { transition: Transition; parallelIndex: number; selfLoop: boolean };
export type TransitionEdgeType = Edge<TransitionEdgeData, "transition">;

/** solid = happy, dashed = error/alternate, dotted = back. */
export const EDGE_DASH: Record<TransitionKind, string | undefined> = {
  happy: undefined,
  error: "8 5",
  alternate: "4 4",
  back: "1.5 5",
};

function TransitionEdgeImpl(props: EdgeProps<TransitionEdgeType>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data, markerEnd } = props;
  if (!data) return null;
  const { transition, parallelIndex, selfLoop } = data;
  let path: string;
  let labelX: number;
  let labelY: number;
  if (selfLoop) {
    const r = 46 + parallelIndex * 18;
    path = `M ${sourceX} ${sourceY} C ${sourceX + r * 1.6} ${sourceY - r * 2.4}, ${targetX - r * 1.6} ${targetY - r * 2.4}, ${targetX} ${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = Math.min(sourceY, targetY) - r * 1.8;
  } else {
    const under = sourcePosition === "bottom" && targetPosition === "bottom";
    [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      curvature: under ? 0.6 + parallelIndex * 0.3 : 0.25 + parallelIndex * 0.35,
    });
    labelY += parallelIndex * 26;
  }
  const dash = EDGE_DASH[transition.kind];
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={18}
        style={{
          stroke: "#1c1c1c",
          strokeWidth: selected ? 2.6 : 1.6,
          strokeDasharray: dash,
          strokeLinecap: transition.kind === "back" ? "round" : "butt",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute max-w-[180px] rounded-sm border bg-white px-1.5 py-0.5 text-[10px] leading-tight text-neutral-800"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            borderStyle: selected ? "dashed" : "solid",
            borderColor: selected ? "#1c1c1c" : "#c4c4c4",
            borderWidth: selected ? 2 : 1,
          }}
          data-testid={`flow-edge-label-${transition.id}`}
          onClick={(e) => {
            e.stopPropagation();
            actions.select({ kind: "transition", id: transition.id });
          }}
        >
          <span>{transition.trigger}</span>
          {transition.kind !== "happy" && <span className="ml-1 uppercase tracking-wider text-neutral-500">· {transition.kind}</span>}
          {transition.condition && <div className="italic text-neutral-500">if {transition.condition}</div>}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const TransitionEdge = memo(TransitionEdgeImpl);
