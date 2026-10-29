import { useEffect, useState } from "react";
import { useStore, type ViewMode } from "./store/store";
import { FlowView } from "./views/flow/FlowView";
import { StoryboardView } from "./views/storyboard/StoryboardView";
import { Inspector } from "./panels/Inspector";
import { ScreenEditor } from "./panels/ScreenEditor";
import { IdeatePanel } from "./panels/IdeatePanel";
import { RefinePanel } from "./panels/RefinePanel";
import { TopBar } from "./panels/TopBar";
import { useKeyboard } from "./useKeyboard";
import { useProjectPersistence } from "./api/persistence";

export function App() {
  useKeyboard();
  useProjectPersistence();
  const view = useStore((s) => s.view);
  const [rightTab, setRightTab] = useState<"inspect" | "refine">("inspect");
  const [leftOpen, setLeftOpen] = useState(true);

  useEffect(() => {
    document.title = "FlowSketch";
  }, []);

  return (
    <div className="flex h-full flex-col bg-neutral-100 text-neutral-900">
      <TopBar leftOpen={leftOpen} onToggleLeft={() => setLeftOpen(!leftOpen)} />
      <div className="flex min-h-0 flex-1">
        {leftOpen && (
          <aside className="w-72 flex-none overflow-y-auto border-r border-neutral-300 bg-white">
            <IdeatePanel />
          </aside>
        )}
        <main className="relative min-w-0 flex-1">
          <Views view={view} />
          <ScreenEditor />
        </main>
        <aside className="flex w-80 flex-none flex-col border-l border-neutral-300 bg-white">
          <div className="flex border-b border-neutral-200">
            {(["inspect", "refine"] as const).map((t) => (
              <button
                key={t}
                className={`flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider ${rightTab === t ? "border-b-2 border-neutral-900 text-neutral-900" : "text-neutral-500"}`}
                onClick={() => setRightTab(t)}
              >
                {t === "inspect" ? "Inspect" : "Refine with AI"}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{rightTab === "inspect" ? <Inspector /> : <RefinePanel />}</div>
        </aside>
      </div>
    </div>
  );
}

function Views({ view }: { view: ViewMode }) {
  if (view === "flow") return <FlowView />;
  if (view === "storyboard") return <StoryboardView />;
  return (
    <div className="flex h-full">
      <div className="h-full w-1/2 border-r border-neutral-300"><FlowView /></div>
      <div className="h-full w-1/2"><StoryboardView /></div>
    </div>
  );
}

