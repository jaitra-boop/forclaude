import { useState } from "react";
import { actions, activeFlow, useStore, type ViewMode } from "../store/store";
import { useStatus } from "../api/status";
import { computePath } from "../model/paths";
import { exportFlowPng } from "../export/png";
import { downloadStoryboardHtml, printStoryboard } from "../export/storyboardHtml";
import { flowToMarkdown } from "../export/markdown";
import { downloadText, slug } from "../export/download";

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "flow", label: "Flow" },
  { id: "storyboard", label: "Storyboard" },
  { id: "split", label: "Split" },
];

export function TopBar({ leftOpen, onToggleLeft }: { leftOpen: boolean; onToggleLeft: () => void }) {
  const view = useStore((s) => s.view);
  const flows = useStore((s) => s.project.flows);
  const activeId = useStore((s) => s.activeFlowId);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const status = useStatus();
  const [exportOpen, setExportOpen] = useState(false);

  const flow = activeFlow();
  const steps = () => {
    const s = useStore.getState();
    return flow ? computePath(flow, s.pathChoices[flow.id] ?? {}) : [];
  };

  const exports: { label: string; run: () => void }[] = flow
    ? [
        { label: "JSON (project model)", run: () => downloadText(`${slug(useStore.getState().project.name)}.flow.json`, JSON.stringify(useStore.getState().project, null, 2), "application/json") },
        { label: "PNG (flow view)", run: () => { if (view === "storyboard") actions.setView("split"); setTimeout(() => exportFlowPng(flow), 50); } },
        { label: "Print / PDF (storyboard)", run: () => printStoryboard(flow, steps()) },
        { label: "HTML (storyboard)", run: () => downloadStoryboardHtml(flow, steps()) },
        { label: "Markdown (screens as text)", run: () => downloadText(`${slug(flow.title)}.md`, flowToMarkdown(flow, useStore.getState().project.personas), "text/markdown") },
      ]
    : [];

  return (
    <header className="flex h-11 flex-none items-center gap-2 border-b border-neutral-300 bg-white px-3">
      <button className="fs-btn" onClick={onToggleLeft} title="Toggle the Ideate panel">{leftOpen ? "◧" : "☰"} Ideate</button>
      <div className="font-mono text-sm font-bold tracking-tight">FlowSketch</div>
      <select
        className="fs-input w-auto max-w-[220px]"
        value={activeId}
        onChange={(e) => actions.setActiveFlow(e.target.value)}
        aria-label="Active flow"
        data-testid="flow-select"
      >
        {flows.length === 0 && <option value="">No flows</option>}
        {flows.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
      </select>
      {flow && (
        <button className="fs-btn" title="Delete this flow" onClick={() => { if (confirm(`Delete flow “${flow.title}”? (Undo with Ctrl/Cmd+Z)`)) actions.deleteFlow(flow.id); }}>
          Delete flow
        </button>
      )}

      <div className="mx-auto flex rounded border border-neutral-400" role="tablist" aria-label="View">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={view === v.id}
            className={`px-3 py-1 text-xs font-medium ${view === v.id ? "bg-neutral-900 text-white" : "bg-white text-neutral-700 hover:bg-neutral-100"}`}
            onClick={() => actions.setView(v.id)}
            data-testid={`view-${v.id}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <button className="fs-btn" disabled={!canUndo} onClick={actions.undo} title="Undo (Ctrl/Cmd+Z)">↶ Undo</button>
      <button className="fs-btn" disabled={!canRedo} onClick={actions.redo} title="Redo (Shift+Ctrl/Cmd+Z)">↷ Redo</button>
      <div className="relative">
        <button className="fs-btn" disabled={!flow} onClick={() => setExportOpen(!exportOpen)}>Export ▾</button>
        {exportOpen && (
          <div className="absolute right-0 top-8 z-50 w-56 rounded border border-neutral-900 bg-white py-1" onMouseLeave={() => setExportOpen(false)}>
            {exports.map((x) => (
              <button key={x.label} className="block w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-100" onClick={() => { setExportOpen(false); x.run(); }}>
                {x.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <StatusBadge {...status} />
    </header>
  );
}

function StatusBadge({ connected, mock, model, save, saveError }: ReturnType<typeof useStatus.getState>) {
  const saveText = { idle: "", saving: "Saving…", saved: "Saved", error: "Save failed", offline: "Offline (not saved)" }[save];
  return (
    <div className="flex items-center gap-2 text-[11px] text-neutral-500" title={saveError}>
      {connected && (
        <span className={`rounded border px-1.5 py-0.5 ${mock ? "border-dashed border-neutral-900 text-neutral-900" : "border-neutral-300"}`} title={mock ? "No ANTHROPIC_API_KEY: using the built-in sample flow and canned refinements" : `Model: ${model}`}>
          {mock ? "Mock mode" : model}
        </span>
      )}
      <span className={save === "error" ? "font-semibold text-neutral-900 underline decoration-dashed" : ""}>{saveText}</span>
    </div>
  );
}
