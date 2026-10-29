/**
 * Side panel editing whatever is selected. Shared by both views: it reads the
 * shared selection and writes through store actions, so edits show everywhere.
 */
import { useState, type ReactNode } from "react";
import { actions, activeFlow, useStore } from "../store/store";
import { findElement } from "../model/ops";
import { ELEMENT_LABELS } from "../wireframe/elements";
import { annotationNumbers } from "../wireframe/WireframeScreen";
import {
  ANNOTATION_TYPES,
  ELEMENT_TYPES,
  SCREEN_KINDS,
  TRANSITION_KINDS,
  type Annotation,
  type AnnotationType,
  type Element,
  type ElementProps,
  type ElementType,
  type Flow,
  type Screen,
  type ScreenKind,
  type Transition,
  type TransitionKind,
} from "../model/schema";

export function Inspector() {
  const flow = useStore((s) => activeFlow(s));
  const selection = useStore((s) => s.selection);
  if (!flow) return <Empty>No flow loaded.</Empty>;
  if (!selection) return <FlowInspector flow={flow} />;
  switch (selection.kind) {
    case "screen": {
      const screen = flow.screens.find((s) => s.id === selection.id);
      return screen ? <ScreenInspector flow={flow} screen={screen} /> : null;
    }
    case "element": {
      const found = findElement(flow, selection.id);
      return found ? <ElementInspector flow={flow} screen={found.screen} element={found.element} /> : null;
    }
    case "transition": {
      const t = flow.transitions.find((x) => x.id === selection.id);
      return t ? <TransitionInspector flow={flow} transition={t} /> : null;
    }
    case "annotation":
      return <AnnotationInspector flow={flow} annotationId={selection.id} />;
  }
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="p-4 text-xs text-neutral-500">{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-2 block">
      <span className="fs-label">{label}</span>
      {children}
    </label>
  );
}

function Header({ kind, title, children }: { kind: string; title: string; children?: ReactNode }) {
  return (
    <div className="fs-section flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{kind}</div>
        <div className="truncate text-sm font-semibold">{title}</div>
      </div>
      <div className="flex flex-wrap justify-end gap-1">{children}</div>
    </div>
  );
}

// ---------- Flow ----------

function FlowInspector({ flow }: { flow: Flow }) {
  const personas = useStore((s) => s.project.personas);
  return (
    <div>
      <Header kind="Flow" title={flow.title} />
      <div className="fs-section">
        <Field label="Title">
          <input className="fs-input" value={flow.title} onChange={(e) => actions.updateFlowMeta({ title: e.target.value })} />
        </Field>
        <Field label="Goal">
          <textarea className="fs-input" rows={2} value={flow.goal} onChange={(e) => actions.updateFlowMeta({ goal: e.target.value })} />
        </Field>
        <Field label="Persona">
          <select className="fs-input" value={flow.personaId} onChange={(e) => actions.updateFlowMeta({ personaId: e.target.value })}>
            <option value="">— none —</option>
            {personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Platform">
          <select className="fs-input" value={flow.platform} onChange={(e) => actions.updateFlowMeta({ platform: e.target.value as Flow["platform"] })}>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
        </Field>
        <Field label="Notes">
          <textarea className="fs-input" rows={4} value={flow.notes} onChange={(e) => actions.updateFlowMeta({ notes: e.target.value })} />
        </Field>
        {flow.contextFiles && flow.contextFiles.length > 0 && (
          <div className="text-[11px] text-neutral-500">Generated with context: {flow.contextFiles.join(", ")}</div>
        )}
      </div>
      <Empty>Select a screen, element, transition or note to edit it. {flow.screens.length} screens · {flow.transitions.length} transitions.</Empty>
    </div>
  );
}

// ---------- Screen ----------

function ScreenInspector({ flow, screen }: { flow: Flow; screen: Screen }) {
  const isStart = flow.startScreenId === screen.id;
  const out = flow.transitions.filter((t) => t.from === screen.id);
  const incoming = flow.transitions.filter((t) => t.to === screen.id);
  const title = (id: string) => flow.screens.find((s) => s.id === id)?.title ?? id;
  return (
    <div>
      <Header kind={isStart ? "Screen · start" : "Screen"} title={screen.title}>
        <button className="fs-btn" onClick={() => actions.openEditor(screen.id)}>Edit</button>
        <button className="fs-btn" onClick={() => actions.duplicateScreen(screen.id)} title="Ctrl/Cmd+D">Duplicate</button>
        <button className="fs-btn" onClick={() => actions.deleteScreen(screen.id)} title="Delete">Delete</button>
      </Header>
      <div className="fs-section">
        <Field label="Title">
          <input className="fs-input" value={screen.title} onChange={(e) => actions.updateScreen(screen.id, { title: e.target.value })} data-testid="screen-title-input" />
        </Field>
        <Field label="Purpose">
          <textarea className="fs-input" rows={2} value={screen.purpose} onChange={(e) => actions.updateScreen(screen.id, { purpose: e.target.value })} />
        </Field>
        <Field label="Kind">
          <select className="fs-input" value={screen.kind} onChange={(e) => actions.updateScreen(screen.id, { kind: e.target.value as ScreenKind })}>
            {SCREEN_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <button className="fs-btn" disabled={isStart} onClick={() => actions.setStartScreen(screen.id)}>
          {isStart ? "This is the start screen" : "Set as start screen"}
        </button>
      </div>
      <div className="fs-section">
        <div className="fs-h">Transitions</div>
        {out.length === 0 && incoming.length === 0 && <div className="text-[11px] text-neutral-500">None yet. Link a button or draw an edge.</div>}
        {out.map((t) => (
          <TransitionRow key={t.id} t={t} label={`→ ${title(t.to)}`} />
        ))}
        {incoming.map((t) => (
          <TransitionRow key={t.id} t={t} label={`← from ${title(t.from)}`} />
        ))}
      </div>
      <AnnotationList flow={flow} owner={{ screenId: screen.id }} annotations={screen.annotations} screen={screen} />
    </div>
  );
}

function TransitionRow({ t, label }: { t: Transition; label: string }) {
  return (
    <button
      className="mb-1 block w-full rounded border border-neutral-200 px-2 py-1 text-left text-[11px] hover:border-neutral-900"
      onClick={() => actions.select({ kind: "transition", id: t.id })}
    >
      <span className="font-semibold">{label}</span> <span className="text-neutral-500">· {t.kind}</span>
      <div className="truncate text-neutral-600">{t.trigger}</div>
    </button>
  );
}

// ---------- Element ----------

const ITEM_TYPES = new Set<ElementType>(["list", "tabs", "nav-bar", "select", "radio"]);
const PLACEHOLDER_TYPES = new Set<ElementType>(["text-input", "textarea", "search", "select"]);
const TEXT_TYPES = new Set<ElementType>(["text", "banner", "card", "toast"]);
const CHECK_TYPES = new Set<ElementType>(["checkbox", "toggle"]);

function ElementInspector({ flow, screen, element }: { flow: Flow; screen: Screen; element: Element }) {
  const setProp = (key: string, value: ElementProps[string] | undefined) => {
    const props = { ...element.props };
    if (value === undefined || value === "") delete props[key];
    else props[key] = value;
    actions.updateElement(element.id, { props });
  };
  const str = (k: string) => (typeof element.props[k] === "string" ? (element.props[k] as string) : "");
  return (
    <div>
      <Header kind={`Element · ${screen.title}`} title={element.label || ELEMENT_LABELS[element.type]}>
        <button className="fs-btn" onClick={() => actions.duplicateElement(element.id)} title="Ctrl/Cmd+D">Duplicate</button>
        <button className="fs-btn" onClick={() => actions.deleteElement(element.id)} title="Delete">Delete</button>
      </Header>
      <div className="fs-section">
        <Field label="Type">
          <select className="fs-input" value={element.type} onChange={(e) => actions.updateElement(element.id, { type: e.target.value as ElementType })} data-testid="element-type-select">
            {ELEMENT_TYPES.map((t) => <option key={t} value={t}>{ELEMENT_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="Label">
          <input className="fs-input" value={element.label} onChange={(e) => actions.updateElement(element.id, { label: e.target.value })} data-testid="element-label-input" />
        </Field>
        {PLACEHOLDER_TYPES.has(element.type) && (
          <Field label="Placeholder">
            <input className="fs-input" value={str("placeholder")} onChange={(e) => setProp("placeholder", e.target.value)} />
          </Field>
        )}
        {TEXT_TYPES.has(element.type) && (
          <Field label="Text">
            <textarea className="fs-input" rows={2} value={str("text")} onChange={(e) => setProp("text", e.target.value)} />
          </Field>
        )}
        {ITEM_TYPES.has(element.type) && (
          <Field label="Items (one per line)">
            <textarea
              className="fs-input"
              rows={4}
              value={Array.isArray(element.props.items) ? element.props.items.join("\n") : ""}
              onChange={(e) => setProp("items", e.target.value.split("\n"))}
            />
          </Field>
        )}
        {CHECK_TYPES.has(element.type) && (
          <label className="mb-2 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={element.props.checked === true} onChange={(e) => setProp("checked", e.target.checked)} /> Checked / on
          </label>
        )}
        {element.type === "progress" && (
          <Field label="Value (0-100)">
            <input className="fs-input" type="number" min={0} max={100} value={typeof element.props.value === "number" ? element.props.value : 50} onChange={(e) => setProp("value", Number(e.target.value))} />
          </Field>
        )}
        <Field label="Row group (same id = side by side)">
          <input className="fs-input" value={str("row")} placeholder="e.g. actions" onChange={(e) => setProp("row", e.target.value)} />
        </Field>
      </div>
      <LinkSection flow={flow} screen={screen} element={element} />
      <AnnotationList
        flow={flow}
        owner={{ screenId: screen.id }}
        screen={screen}
        annotations={screen.annotations.filter((a) => a.targetElementId === element.id)}
        targetElementId={element.id}
      />
    </div>
  );
}

const NEW_SCREEN = "__new__";

function LinkSection({ flow, screen, element }: { flow: Flow; screen: Screen; element: Element }) {
  const t = element.linkTo ? flow.transitions.find((x) => x.id === element.linkTo) : undefined;
  const [target, setTarget] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [kind, setKind] = useState<TransitionKind>("happy");
  const link = () => {
    if (target === NEW_SCREEN) {
      if (!newTitle.trim()) return;
      actions.linkElementToScreen(element.id, { newScreenTitle: newTitle.trim() }, kind);
      setNewTitle("");
    } else if (target) {
      actions.linkElementToScreen(element.id, { screenId: target }, kind);
    }
    setTarget("");
  };
  return (
    <div className="fs-section">
      <div className="fs-h">Link to screen…</div>
      {t && (
        <div className="mb-2 rounded border border-neutral-300 p-2 text-[11px]">
          Fires <button className="underline" onClick={() => actions.select({ kind: "transition", id: t.id })}>{t.trigger}</button> →{" "}
          <strong>{flow.screens.find((s) => s.id === t.to)?.title}</strong> <span className="text-neutral-500">({t.kind})</span>
          <button className="fs-btn ml-2" onClick={() => actions.unlinkElement(element.id)}>Unlink</button>
        </div>
      )}
      <div className="flex gap-1">
        <select className="fs-input" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="link-target-select">
          <option value="">{t ? "Change destination…" : "Choose destination…"}</option>
          {flow.screens.filter((s) => s.id !== screen.id).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          <option value={NEW_SCREEN}>+ New screen…</option>
        </select>
        <select className="fs-input w-24" value={kind} onChange={(e) => setKind(e.target.value as TransitionKind)} title="Transition kind">
          {TRANSITION_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      {target === NEW_SCREEN && (
        <input className="fs-input mt-1" placeholder="New screen title" value={newTitle} autoFocus onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && link()} />
      )}
      <button className="fs-btn mt-1" disabled={!target || (target === NEW_SCREEN && !newTitle.trim())} onClick={link} data-testid="link-apply">
        {t ? "Relink" : "Link"}
      </button>
    </div>
  );
}

// ---------- Transition ----------

function TransitionInspector({ flow, transition: t }: { flow: Flow; transition: Transition }) {
  const from = flow.screens.find((s) => s.id === t.from);
  return (
    <div>
      <Header kind="Transition" title={t.trigger}>
        <button className="fs-btn" onClick={() => actions.deleteTransition(t.id)}>Delete</button>
      </Header>
      <div className="fs-section">
        <Field label="Trigger (edge label)">
          <input className="fs-input" value={t.trigger} onChange={(e) => actions.updateTransition(t.id, { trigger: e.target.value })} data-testid="transition-trigger-input" />
        </Field>
        <Field label="Kind">
          <select className="fs-input" value={t.kind} onChange={(e) => actions.updateTransition(t.id, { kind: e.target.value as TransitionKind })} data-testid="transition-kind-select">
            {TRANSITION_KINDS.map((k) => <option key={k} value={k}>{k}{k === "happy" ? " (solid)" : k === "back" ? " (dotted)" : " (dashed)"}</option>)}
          </select>
        </Field>
        <Field label="Condition (optional)">
          <input className="fs-input" value={t.condition ?? ""} placeholder="e.g. email is already a member" onChange={(e) => actions.updateTransition(t.id, { condition: e.target.value })} />
        </Field>
        <Field label="From">
          <select className="fs-input" value={t.from} onChange={(e) => actions.updateTransition(t.id, { from: e.target.value })}>
            {flow.screens.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </Field>
        <Field label="To">
          <select className="fs-input" value={t.to} onChange={(e) => actions.updateTransition(t.id, { to: e.target.value })}>
            {flow.screens.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </Field>
        <Field label="Fired by element">
          <select
            className="fs-input"
            value={t.triggerElementId ?? ""}
            onChange={(e) => actions.updateTransition(t.id, { triggerElementId: e.target.value || null })}
          >
            <option value="">— none (system event) —</option>
            {from?.elements.map((el) => <option key={el.id} value={el.id}>{ELEMENT_LABELS[el.type]}: {el.label}</option>)}
          </select>
        </Field>
      </div>
      <AnnotationList flow={flow} owner={{ transitionId: t.id }} annotations={t.annotations} />
    </div>
  );
}

// ---------- Annotations ----------

const TYPE_LABEL: Record<AnnotationType, string> = {
  rationale: "Why",
  "edge-case": "Edge case",
  "open-question": "Open question",
  "tech-note": "Tech note",
  evidence: "Evidence",
};
export { TYPE_LABEL as ANNOTATION_TYPE_LABEL };

function AnnotationList({
  flow,
  owner,
  annotations,
  screen,
  targetElementId,
}: {
  flow: Flow;
  owner: { screenId: string } | { transitionId: string };
  annotations: Annotation[];
  screen?: Screen;
  targetElementId?: string;
}) {
  const numbers = screen ? annotationNumbers(screen) : undefined;
  void flow;
  return (
    <div className="fs-section">
      <div className="mb-2 flex items-center">
        <div className="fs-h mb-0 flex-1">Notes</div>
        <button className="fs-btn" onClick={() => actions.addAnnotation(owner, { targetElementId })} data-testid="add-note">+ Note</button>
      </div>
      {annotations.length === 0 && <div className="text-[11px] text-neutral-500">No notes.</div>}
      {annotations.map((a) => (
        <AnnotationEditor key={a.id} annotation={a} number={numbers?.get(a.id)} screen={screen} />
      ))}
    </div>
  );
}

function AnnotationEditor({ annotation: a, number, screen }: { annotation: Annotation; number?: number; screen?: Screen }) {
  const selected = useStore((s) => s.selection?.kind === "annotation" && s.selection.id === a.id);
  return (
    <div className={`mb-2 rounded border p-1.5 ${selected ? "border-dashed border-neutral-900" : "border-neutral-200"}`}>
      <div className="mb-1 flex items-center gap-1">
        {number !== undefined && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-neutral-700 px-1 text-[9px] font-bold text-white">{number}</span>}
        <select className="fs-input w-auto py-0" value={a.type} onChange={(e) => actions.updateAnnotation(a.id, { type: e.target.value as AnnotationType })}>
          {ANNOTATION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        {screen && (
          <select
            className="fs-input w-auto flex-1 py-0"
            value={a.targetElementId ?? ""}
            onChange={(e) => actions.updateAnnotation(a.id, { targetElementId: e.target.value || null })}
            title="Pin to element"
          >
            <option value="">Whole screen</option>
            {screen.elements.map((el) => <option key={el.id} value={el.id}>{el.label || ELEMENT_LABELS[el.type]}</option>)}
          </select>
        )}
        <button className="fs-btn px-1 py-0" onClick={() => actions.deleteAnnotation(a.id)} title="Delete note">×</button>
      </div>
      <textarea
        className="fs-input"
        rows={2}
        value={a.text}
        autoFocus={selected && a.text === ""}
        placeholder="Why does this exist? What's unknown?"
        onChange={(e) => actions.updateAnnotation(a.id, { text: e.target.value })}
        data-testid="annotation-text"
      />
    </div>
  );
}

function AnnotationInspector({ flow, annotationId }: { flow: Flow; annotationId: string }) {
  for (const s of flow.screens) {
    const a = s.annotations.find((x) => x.id === annotationId);
    if (a) {
      return (
        <div>
          <Header kind={`Note · ${s.title}`} title={TYPE_LABEL[a.type]}>
            <button className="fs-btn" onClick={() => actions.select({ kind: "screen", id: s.id })}>Screen</button>
          </Header>
          <div className="fs-section">
            <AnnotationEditor annotation={a} number={annotationNumbers(s).get(a.id)} screen={s} />
          </div>
        </div>
      );
    }
  }
  for (const t of flow.transitions) {
    const a = t.annotations.find((x) => x.id === annotationId);
    if (a) {
      return (
        <div>
          <Header kind="Note · transition" title={TYPE_LABEL[a.type]}>
            <button className="fs-btn" onClick={() => actions.select({ kind: "transition", id: t.id })}>Transition</button>
          </Header>
          <div className="fs-section"><AnnotationEditor annotation={a} /></div>
        </div>
      );
    }
  }
  return null;
}
