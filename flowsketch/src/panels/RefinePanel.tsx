/**
 * "Refine with AI": asks the server for a patch to the current flow, shows a
 * diff summary, and applies it (one undoable step) only when accepted.
 */
import { useState } from "react";
import { actions, activeFlow, useStore } from "../store/store";
import { api, ApiRequestError } from "../api/client";
import { useStatus } from "../api/status";
import { describePatch, refinePatchProblems } from "../model/refine";
import type { RefinePatch } from "../model/aiSchema";
import type { RefineAction } from "../model/api";
import { ErrorBox, Spinner } from "./IdeatePanel";

const ACTIONS: { id: Exclude<RefineAction, "custom">; label: string }[] = [
  { id: "add-error-states", label: "Add error and empty states" },
  { id: "simplify", label: "Simplify this flow" },
  { id: "suggest-missing", label: "Suggest missing screens or interactions" },
  { id: "rewrite-annotations", label: "Rewrite annotations to be more specific" },
];

interface Pending {
  patch: RefinePatch;
  flowId: string;
  /** Model revision the patch was computed against. */
  revision: number;
  label: string;
  mock: boolean;
}

export function RefinePanel() {
  const flow = useStore((s) => activeFlow(s));
  const selection = useStore((s) => s.selection);
  const revision = useStore((s) => s.revision);
  const personas = useStore((s) => s.project.personas);
  const connected = useStatus((s) => s.connected);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [scopeToScreen, setScopeToScreen] = useState(true);

  if (!flow) return <div className="p-4 text-xs text-neutral-500">No flow loaded.</div>;

  const selectedScreenId =
    selection?.kind === "screen" ? selection.id
    : selection?.kind === "element" || selection?.kind === "annotation" ? selection.screenId
    : undefined;
  const selectedScreen = flow.screens.find((s) => s.id === selectedScreenId);
  const screenId = scopeToScreen ? selectedScreen?.id : undefined;

  const run = async (action: RefineAction, label: string) => {
    setLoading(label);
    setError(null);
    setPending(null);
    try {
      const res = await api.refine({
        flow,
        persona: personas.find((p) => p.id === flow.personaId) ?? null,
        action,
        instruction: action === "custom" ? instruction : "",
        screenId,
      });
      setPending({ patch: res.patch, flowId: flow.id, revision: useStore.getState().revision, label, mock: res.mock });
    } catch (e) {
      setError(e instanceof ApiRequestError ? { message: e.message, details: e.details } : { message: String(e), details: [] });
    } finally {
      setLoading(null);
    }
  };

  const stale = pending && (pending.flowId !== flow.id || pending.revision !== revision);
  const problems = pending ? refinePatchProblems(flow, pending.patch) : [];
  const diff = pending ? describePatch(flow, pending.patch) : null;
  const isEmpty = diff && diff.added.length + diff.changed.length + diff.removed.length === 0;

  return (
    <div>
      <div className="fs-section">
        <div className="fs-h">Target</div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={scopeToScreen} onChange={(e) => setScopeToScreen(e.target.checked)} disabled={!selectedScreen} />
          {selectedScreen ? <>Focus on “{selectedScreen.title}”</> : <span className="text-neutral-500">Whole flow (select a screen to focus)</span>}
        </label>
      </div>
      <div className="fs-section space-y-1.5">
        {ACTIONS.map((a) => (
          <button key={a.id} className="fs-btn w-full justify-start" disabled={!!loading || !connected} onClick={() => run(a.id, a.label)} data-testid={`refine-${a.id}`}>
            {loading === a.label ? <Spinner /> : "✦"} {a.label}
          </button>
        ))}
        <textarea
          className="fs-input mt-2"
          rows={3}
          placeholder="Or describe a change… e.g. “Let the user invite several people at once”"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          data-testid="refine-instruction"
        />
        <button className="fs-btn fs-btn-primary" disabled={!!loading || !instruction.trim() || !connected} onClick={() => run("custom", "Custom instruction")} data-testid="refine-custom">
          {loading === "Custom instruction" ? <><Spinner /> Thinking…</> : "Refine"}
        </button>
        {!connected && <p className="text-[11px] text-neutral-500">Server offline: refinement needs `npm run dev`.</p>}
        {error && <ErrorBox title={error.message} details={error.details} />}
      </div>

      {pending && diff && (
        <div className="fs-section" data-testid="refine-preview">
          <div className="fs-h">Proposed change{pending.mock ? " (mock)" : ""}</div>
          <p className="mb-2 text-xs">{pending.patch.summary}</p>
          <DiffList sign="+" title="Added" items={diff.added} />
          <DiffList sign="~" title="Changed" items={diff.changed} />
          <DiffList sign="−" title="Removed" items={diff.removed} />
          {isEmpty && <p className="text-[11px] text-neutral-500">No changes proposed.</p>}
          {stale && <p className="mb-2 text-[11px] font-semibold">The flow changed since this was proposed. Applying will merge where ids still match.</p>}
          {problems.length > 0 && <ErrorBox title="Some references no longer match and will be skipped" details={problems} />}
          <div className="mt-2 flex gap-2">
            <button
              className="fs-btn fs-btn-primary"
              disabled={!!isEmpty}
              onClick={() => {
                if (pending.flowId !== useStore.getState().activeFlowId) actions.setActiveFlow(pending.flowId);
                actions.applyRefinePatch(pending.patch);
                setPending(null);
              }}
              data-testid="refine-accept"
            >
              Accept
            </button>
            <button className="fs-btn" onClick={() => setPending(null)} data-testid="refine-reject">Reject</button>
          </div>
          <p className="mt-1 text-[10px] text-neutral-500">Accepted changes are one undo step.</p>
        </div>
      )}
    </div>
  );
}

function DiffList({ sign, title, items }: { sign: string; title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2">
      <div className="fs-label">{title}</div>
      <ul className="space-y-0.5 font-mono text-[11px]">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5"><span className="font-bold">{sign}</span><span>{it}</span></li>
        ))}
      </ul>
    </div>
  );
}
