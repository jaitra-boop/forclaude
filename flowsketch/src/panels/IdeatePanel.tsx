/** Left panel: persona library, "New flow" form and the context files in use. */
import { useState } from "react";
import { actions, useStore } from "../store/store";
import { useStatus } from "../api/status";
import { api, ApiRequestError } from "../api/client";
import { SAMPLE_FLOW } from "../model/sample";
import { SkillLevel, type Persona, type Platform } from "../model/schema";
import type { Scope } from "../model/api";
import { newId } from "../model/ids";
import { Field } from "./Inspector";

export function IdeatePanel() {
  return (
    <div>
      <NewFlowForm />
      <PersonaLibrary />
      <ContextFiles />
    </div>
  );
}

// ---------- New flow ----------

function NewFlowForm() {
  const personas = useStore((s) => s.project.personas);
  const mock = useStatus((s) => s.mock);
  const connected = useStatus((s) => s.connected);
  const [personaId, setPersonaId] = useState<string>("");
  const [task, setTask] = useState("");
  const [platform, setPlatform] = useState<Platform>("mobile");
  const [extra, setExtra] = useState("");
  const [scope, setScope] = useState<Scope>("full");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const chosen = personas.find((p) => p.id === (personaId || personas[0]?.id));

  const generate = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await api.generateFlow({ persona: chosen ?? null, task, platform, extraContext: extra, scope });
      actions.addFlow(res.flow);
      setInfo(
        `${res.mock ? "Mock flow loaded" : `Generated ${res.flow.screens.length} screens`}${res.attempts > 1 ? " (after one retry)" : ""}.` +
          (res.contextFiles.length ? ` Context: ${res.contextFiles.join(", ")}.` : ""),
      );
    } catch (e) {
      // The existing flow is untouched: nothing is written to the store on failure.
      setError(e instanceof ApiRequestError ? { message: e.message, details: e.details } : { message: String(e), details: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fs-section">
      <div className="fs-h">New flow</div>
      <Field label="Persona">
        <select className="fs-input" value={chosen?.id ?? ""} onChange={(e) => setPersonaId(e.target.value)} data-testid="new-flow-persona">
          {personas.length === 0 && <option value="">— none —</option>}
          {personas.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}
        </select>
      </Field>
      <Field label="Task / goal">
        <textarea className="fs-input" rows={3} value={task} placeholder="e.g. Reset a forgotten password and get back to the dashboard" onChange={(e) => setTask(e.target.value)} data-testid="new-flow-task" />
      </Field>
      <div className="flex gap-2">
        <Field label="Platform">
          <select className="fs-input" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
        </Field>
        <Field label="Scope">
          <select className="fs-input" value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
            <option value="full">Errors &amp; edge cases</option>
            <option value="happy">Happy path only</option>
          </select>
        </Field>
      </div>
      <Field label="Extra context (optional)">
        <textarea className="fs-input" rows={2} value={extra} placeholder="Constraints, existing screens, research notes…" onChange={(e) => setExtra(e.target.value)} />
      </Field>
      <button className="fs-btn fs-btn-primary w-full justify-center py-1.5" disabled={loading || !task.trim() || !connected} onClick={generate} data-testid="generate">
        {loading ? <><Spinner /> Generating flow…</> : mock ? "Generate (mock: sample flow)" : "Generate flow"}
      </button>
      {!connected && <p className="mt-1 text-[11px] text-neutral-500">Server offline: generation needs `npm run dev`.</p>}
      {loading && <p className="mt-1 text-[11px] text-neutral-500">This can take a minute. Your current flow stays as it is.</p>}
      {info && <p className="mt-1 text-[11px] text-neutral-600" data-testid="generate-info">{info}</p>}
      {error && <ErrorBox title={error.message} details={error.details} />}
      <button className="mt-2 text-[11px] text-neutral-500 underline" onClick={() => actions.addFlow({ ...structuredClone(SAMPLE_FLOW), id: newId("fl") })}>
        Add the sample flow (“Invite a teammate”)
      </button>
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-white" aria-hidden />;
}

export function ErrorBox({ title, details }: { title: string; details: string[] }) {
  return (
    <div className="mt-2 rounded border-2 border-dashed border-neutral-900 bg-white p-2 text-[11px]" role="alert" data-testid="error-box">
      <div className="font-semibold">{title}</div>
      {details.length > 0 && (
        <ul className="mt-1 list-disc pl-4 text-neutral-600">
          {details.slice(0, 6).map((d, i) => <li key={i} className="break-words">{d}</li>)}
        </ul>
      )}
    </div>
  );
}

// ---------- Personas ----------

function PersonaLibrary() {
  const personas = useStore((s) => s.project.personas);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="fs-section">
      <div className="mb-2 flex items-center">
        <div className="fs-h mb-0 flex-1">Personas</div>
        <button className="fs-btn" onClick={() => setOpen(actions.addPersona())} data-testid="add-persona">+ Persona</button>
      </div>
      {personas.length === 0 && <div className="text-[11px] text-neutral-500">No personas yet.</div>}
      {personas.map((p) => (
        <div key={p.id} className="mb-1.5 rounded border border-neutral-200">
          <button className="flex w-full items-center gap-2 px-2 py-1.5 text-left" onClick={() => setOpen(open === p.id ? null : p.id)}>
            <span className="grid h-6 w-6 flex-none place-items-center rounded-full border border-neutral-500 text-[10px] font-bold">{initials(p.name)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{p.name}</span>
              <span className="block truncate text-[10px] text-neutral-500">{p.role || "No role"} · {p.skillLevel}</span>
            </span>
            <span className="text-[10px] text-neutral-400">{open === p.id ? "▴" : "▾"}</span>
          </button>
          {open === p.id && <PersonaForm persona={p} />}
        </div>
      ))}
    </div>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";
}

function ListField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Field label={`${label} (one per line)`}>
      <textarea className="fs-input" rows={3} value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
    </Field>
  );
}

function PersonaForm({ persona: p }: { persona: Persona }) {
  const up = (patch: Partial<Omit<Persona, "id">>) => actions.updatePersona(p.id, patch);
  return (
    <div className="border-t border-neutral-200 p-2">
      <Field label="Name"><input className="fs-input" value={p.name} onChange={(e) => up({ name: e.target.value })} /></Field>
      <Field label="Role"><input className="fs-input" value={p.role} onChange={(e) => up({ role: e.target.value })} /></Field>
      <Field label="Skill level">
        <select className="fs-input" value={p.skillLevel} onChange={(e) => up({ skillLevel: e.target.value as SkillLevel })}>
          {SkillLevel.options.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Context"><textarea className="fs-input" rows={2} value={p.context} onChange={(e) => up({ context: e.target.value })} /></Field>
      <ListField label="Goals" value={p.goals} onChange={(goals) => up({ goals })} />
      <ListField label="Constraints" value={p.constraints} onChange={(constraints) => up({ constraints })} />
      <ListField label="Pain points" value={p.painPoints} onChange={(painPoints) => up({ painPoints })} />
      <button className="fs-btn" onClick={() => { if (confirm(`Delete persona “${p.name}”?`)) actions.deletePersona(p.id); }}>Delete persona</button>
    </div>
  );
}

// ---------- Context ----------

function ContextFiles() {
  const files = useStatus((s) => s.contextFiles);
  const connected = useStatus((s) => s.connected);
  return (
    <div className="fs-section">
      <div className="fs-h">Context folder</div>
      {!connected ? (
        <div className="text-[11px] text-neutral-500">Server offline.</div>
      ) : files.length === 0 ? (
        <div className="text-[11px] text-neutral-500">No <code>./context/*.md</code> files found. Add personas, principles or tech limits there to ground every generation.</div>
      ) : (
        <>
          <div className="mb-1 text-[11px] text-neutral-500">Included in every generation:</div>
          <ul className="space-y-0.5">
            {files.map((f) => <li key={f} className="font-mono text-[11px]">· {f}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
