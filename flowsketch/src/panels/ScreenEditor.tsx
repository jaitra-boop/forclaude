/** Screen editor drawer (double-click a node in the flow view). Same editable frame as the storyboard. */
import { useState } from "react";
import { actions, activeFlow, useStore } from "../store/store";
import { EditableFrame, ElementPalette, FrameDndProvider } from "../views/storyboard/EditableFrame";

export function ScreenEditor() {
  const flow = useStore((s) => activeFlow(s));
  const screenId = useStore((s) => s.editorScreenId);
  const [pinMode, setPinMode] = useState(false);
  const screen = flow?.screens.find((s) => s.id === screenId);
  if (!flow || !screen) return null;
  return (
    <div className="absolute inset-0 z-30 flex bg-neutral-100/95" data-testid="screen-editor">
      <FrameDndProvider>
        <div className="w-40 flex-none overflow-y-auto border-r border-neutral-200 bg-neutral-50 pt-2">
          <ElementPalette targetScreenId={screen.id} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2">
            <input
              className="fs-input max-w-xs text-sm font-semibold"
              value={screen.title}
              onChange={(e) => actions.updateScreen(screen.id, { title: e.target.value })}
              aria-label="Screen title"
            />
            <button className={`fs-btn ${pinMode ? "fs-btn-on" : ""}`} onClick={() => setPinMode(!pinMode)}>{pinMode ? "Click to drop pin…" : "+ Pin note"}</button>
            <button className="fs-btn" disabled={flow.startScreenId === screen.id} onClick={() => actions.setStartScreen(screen.id)}>Set as start</button>
            <button className="fs-btn ml-auto" onClick={() => actions.openEditor(null)} title="Esc">Close</button>
          </div>
          <div className="flex-1 overflow-auto p-8" onClick={() => actions.select({ kind: "screen", id: screen.id })}>
            <div className="mx-auto w-fit" onClick={(e) => e.stopPropagation()}>
              <EditableFrame screen={screen} platform={flow.platform} pinMode={pinMode} onPinPlaced={() => setPinMode(false)} />
            </div>
          </div>
        </div>
      </FrameDndProvider>
    </div>
  );
}
