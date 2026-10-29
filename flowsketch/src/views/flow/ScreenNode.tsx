import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { ScaledWireframe } from "../../wireframe/WireframeScreen";
import { nodeSize } from "../../model/layout";
import type { Platform, Screen } from "../../model/schema";

export type ScreenNodeData = {
  screen: Screen;
  platform: Platform;
  isStart: boolean;
  /** True when something inside this screen (an element/annotation) is selected. */
  containsSelection: boolean;
};
export type ScreenNodeType = Node<ScreenNodeData, "screen">;

export const THUMB_SCALE = { mobile: 0.55, desktop: 0.44 } as const;

function ScreenNodeImpl({ data, selected }: NodeProps<ScreenNodeType>) {
  const { screen, platform, isStart, containsSelection } = data;
  const size = nodeSize(platform);
  const outline = selected ? "2px dashed #1c1c1c" : containsSelection ? "1.5px dashed #858585" : "1.5px solid transparent";
  return (
    <div
      className="fs-node"
      style={{ width: size.width, height: size.height, outline, outlineOffset: 4, borderRadius: 6 }}
      data-testid={`flow-node-${screen.id}`}
    >
      <div className="flex items-center gap-1.5 px-0.5 pb-1 text-[12px] font-semibold text-neutral-900">
        {isStart && (
          <span className="rounded-sm bg-neutral-900 px-1 py-[1px] text-[9px] font-bold uppercase tracking-wider text-white" title="Start screen">
            Start
          </span>
        )}
        <span className="truncate" data-testid="flow-node-title">{screen.title}</span>
        {screen.kind !== "screen" && <span className="ml-auto text-[9px] uppercase tracking-wider text-neutral-500">{screen.kind}</span>}
      </div>
      <ScaledWireframe screen={screen} platform={platform} scale={THUMB_SCALE[platform]} height={size.height - 24} />
      <Handle type="target" position={Position.Left} id="l" className="fs-handle" />
      <Handle type="source" position={Position.Right} id="r" className="fs-handle" />
      {/* Back / leftward edges route underneath the nodes so their labels don't collide with forward edges. */}
      <Handle type="source" position={Position.Bottom} id="bs" className="fs-handle fs-handle-quiet" style={{ left: "62%" }} />
      <Handle type="target" position={Position.Bottom} id="bt" className="fs-handle fs-handle-quiet" style={{ left: "38%" }} />
    </div>
  );
}

export const ScreenNode = memo(ScreenNodeImpl);
