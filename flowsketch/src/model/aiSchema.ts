/**
 * The "wire" shapes the model writes. They are deliberately flat and fully
 * required (nullable instead of optional) so they fit JSON-schema structured
 * output. Converters turn them into the real model (schema.ts) with fresh ids,
 * repaired references and an auto-layout.
 */
import { z } from "zod";
import { newId } from "./ids";
import { repairFlow } from "./integrity";
import { autoLayout } from "./layout";
import {
  AnnotationType,
  ElementType,
  ScreenKind,
  TransitionKind,
  type Annotation,
  type Element,
  type ElementProps,
  type Flow,
  type Platform,
  type Screen,
} from "./schema";

export const WireElement = z.object({
  id: z.string().describe("Unique id within the flow, e.g. el_login_email"),
  type: ElementType,
  label: z.string().describe("Visible label or the button text"),
  detail: z.string().nullable().describe("Placeholder for inputs/search/select, body copy for text/banner/card/toast, 0-100 for progress, 'on'/'off' for checkbox/toggle"),
  items: z.array(z.string()).nullable().describe("Options for list, tabs, nav-bar, select, radio"),
  row: z.string().nullable().describe("Consecutive elements with the same row id render side by side"),
});
export type WireElement = z.infer<typeof WireElement>;

export const WireAnnotation = z.object({
  type: AnnotationType,
  text: z.string(),
  targetElementId: z.string().nullable(),
});
export type WireAnnotation = z.infer<typeof WireAnnotation>;

export const WireScreen = z.object({
  id: z.string().describe("Unique id, e.g. scr_signup"),
  title: z.string(),
  purpose: z.string(),
  kind: ScreenKind,
  elements: z.array(WireElement),
  annotations: z.array(WireAnnotation),
});
export type WireScreen = z.infer<typeof WireScreen>;

export const WireTransition = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  trigger: z.string().describe('What the user does or what happens, e.g. Tap "Continue"'),
  triggerElementId: z.string().nullable().describe("Element on the `from` screen that fires this, if any"),
  kind: TransitionKind,
  condition: z.string().nullable(),
  annotations: z.array(WireAnnotation),
});
export type WireTransition = z.infer<typeof WireTransition>;

export const WireFlow = z.object({
  title: z.string(),
  goal: z.string(),
  notes: z.string().describe("Assumptions and scope notes for the whole flow"),
  startScreenId: z.string(),
  screens: z.array(WireScreen),
  transitions: z.array(WireTransition),
});
export type WireFlow = z.infer<typeof WireFlow>;

export const RefinePatch = z.object({
  summary: z.string().describe("One or two sentences describing the change"),
  addScreens: z.array(WireScreen),
  updateScreens: z.array(
    z.object({
      id: z.string().describe("Existing screen id"),
      title: z.string().nullable(),
      purpose: z.string().nullable(),
      kind: ScreenKind.nullable(),
      elements: z.array(WireElement).nullable().describe("Full replacement element list; keep existing element ids for kept elements"),
      annotations: z.array(WireAnnotation).nullable().describe("Full replacement annotation list"),
    }),
  ),
  removeScreenIds: z.array(z.string()),
  addTransitions: z.array(WireTransition),
  updateTransitions: z.array(
    z.object({
      id: z.string().describe("Existing transition id"),
      trigger: z.string().nullable(),
      kind: TransitionKind.nullable(),
      condition: z.string().nullable(),
      to: z.string().nullable(),
      annotations: z.array(WireAnnotation).nullable(),
    }),
  ),
  removeTransitionIds: z.array(z.string()),
});
export type RefinePatch = z.infer<typeof RefinePatch>;

// ---------- Conversion ----------

const PLACEHOLDER_TYPES = new Set(["text-input", "textarea", "search", "select"]);
const TEXT_TYPES = new Set(["text", "banner", "card", "toast"]);

export function wireElementToElement(w: WireElement, id: string): Element {
  const props: ElementProps = {};
  if (w.detail !== null && w.detail !== "") {
    if (PLACEHOLDER_TYPES.has(w.type)) props.placeholder = w.detail;
    else if (TEXT_TYPES.has(w.type)) props.text = w.detail;
    else if (w.type === "progress") props.value = clampPct(Number.parseFloat(w.detail));
    else if (w.type === "checkbox" || w.type === "toggle") props.checked = /^(on|true|checked|yes)$/i.test(w.detail);
    else props.text = w.detail;
  }
  if (w.items && w.items.length > 0) props.items = w.items;
  if (w.row) props.row = w.row;
  return { id, type: w.type, label: w.label, props };
}

function clampPct(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 50;
}

export function wireAnnotation(w: WireAnnotation, elementId: (id: string) => string | undefined): Annotation {
  const a: Annotation = { id: newId("an"), type: w.type, text: w.text };
  const target = w.targetElementId ? elementId(w.targetElementId) : undefined;
  if (target) a.targetElementId = target;
  return a;
}

/** Maps model-chosen ids to fresh app ids, consistently, within one conversion. */
export class IdMapper {
  private map = new Map<string, string>();
  constructor(private known: Set<string> = new Set()) {}
  /** Existing ids are kept; new ones get a fresh prefixed id. */
  get(wireId: string, prefix: Parameters<typeof newId>[0]): string {
    if (this.known.has(wireId)) return wireId;
    let id = this.map.get(wireId);
    if (!id) {
      id = newId(prefix);
      this.map.set(wireId, id);
    }
    return id;
  }
  lookup(wireId: string): string | undefined {
    return this.known.has(wireId) ? wireId : this.map.get(wireId);
  }
}

export function wireScreenToScreen(w: WireScreen, ids: IdMapper, position = { x: 0, y: 0 }): Screen {
  const elements = w.elements.map((e) => wireElementToElement(e, ids.get(e.id, "el")));
  const local = new Set(elements.map((e) => e.id));
  return {
    id: ids.get(w.id, "scr"),
    title: w.title,
    purpose: w.purpose,
    kind: w.kind,
    elements,
    annotations: w.annotations.map((a) => wireAnnotation(a, (id) => {
      const mapped = ids.lookup(id);
      return mapped && local.has(mapped) ? mapped : undefined;
    })),
    position,
  };
}

export function wireToFlow(
  wire: WireFlow,
  meta: { personaId: string; platform: Platform; contextFiles?: string[] },
): Flow {
  const ids = new IdMapper();
  const screens = wire.screens.map((s) => wireScreenToScreen(s, ids));
  const screenIds = new Set(screens.map((s) => s.id));
  const transitions = wire.transitions.flatMap((t) => {
    const from = ids.lookup(t.from);
    const to = ids.lookup(t.to);
    if (!from || !to || !screenIds.has(from) || !screenIds.has(to)) return [];
    const tr: Flow["transitions"][number] = {
      id: ids.get(t.id, "tr"),
      from,
      to,
      trigger: t.trigger,
      kind: t.kind,
      annotations: t.annotations.map((a) => wireAnnotation(a, () => undefined)),
    };
    if (t.condition) tr.condition = t.condition;
    const trig = t.triggerElementId ? ids.lookup(t.triggerElementId) : undefined;
    if (trig) tr.triggerElementId = trig;
    return [tr];
  });
  const flow: Flow = {
    id: newId("fl"),
    title: wire.title,
    personaId: meta.personaId,
    goal: wire.goal,
    platform: meta.platform,
    screens,
    transitions,
    startScreenId: ids.lookup(wire.startScreenId) ?? screens[0]?.id ?? "",
    notes: wire.notes,
  };
  if (meta.contextFiles && meta.contextFiles.length > 0) flow.contextFiles = meta.contextFiles;
  repairFlow(flow);
  const positions = autoLayout(flow);
  for (const s of flow.screens) s.position = positions[s.id] ?? s.position;
  return flow;
}

/** The current flow in wire form, so the model can see ids it may reference in a patch. */
export function flowToWire(flow: Flow): WireFlow {
  const el = (e: Element): WireElement => {
    const p = e.props;
    const detail =
      typeof p.placeholder === "string" ? p.placeholder
      : typeof p.text === "string" ? p.text
      : typeof p.value === "number" ? String(p.value)
      : typeof p.checked === "boolean" ? (p.checked ? "on" : "off")
      : null;
    return {
      id: e.id,
      type: e.type,
      label: e.label,
      detail,
      items: Array.isArray(p.items) ? p.items : null,
      row: typeof p.row === "string" ? p.row : null,
    };
  };
  const ann = (a: Annotation): WireAnnotation => ({ type: a.type, text: a.text, targetElementId: a.targetElementId ?? null });
  return {
    title: flow.title,
    goal: flow.goal,
    notes: flow.notes,
    startScreenId: flow.startScreenId,
    screens: flow.screens.map((s) => ({
      id: s.id, title: s.title, purpose: s.purpose, kind: s.kind,
      elements: s.elements.map(el), annotations: s.annotations.map(ann),
    })),
    transitions: flow.transitions.map((t) => ({
      id: t.id, from: t.from, to: t.to, trigger: t.trigger, triggerElementId: t.triggerElementId ?? null,
      kind: t.kind, condition: t.condition ?? null, annotations: t.annotations.map(ann),
    })),
  };
}

/** Basic structural sanity of a generated flow beyond the schema (fed back to the model on retry). */
export function wireFlowProblems(w: WireFlow): string[] {
  const problems: string[] = [];
  const screenIds = new Set(w.screens.map((s) => s.id));
  if (w.screens.length === 0) problems.push("The flow has no screens.");
  if (!screenIds.has(w.startScreenId)) problems.push(`startScreenId "${w.startScreenId}" is not one of the screen ids.`);
  for (const t of w.transitions) {
    if (!screenIds.has(t.from)) problems.push(`Transition ${t.id} has unknown from "${t.from}".`);
    if (!screenIds.has(t.to)) problems.push(`Transition ${t.id} has unknown to "${t.to}".`);
    if (!t.trigger.trim()) problems.push(`Transition ${t.id} has an empty trigger.`);
  }
  return problems;
}
