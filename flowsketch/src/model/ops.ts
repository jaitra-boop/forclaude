/**
 * Pure model mutations. Each op mutates a Project (normally an immer draft) and
 * returns any id it created. The store wraps these in `produceWithPatches`, so
 * every op is undoable, and both views call exactly the same ops.
 */
import { newId } from "./ids";
import { repairFlow } from "./integrity";
import type {
  Annotation,
  AnnotationType,
  Element,
  ElementProps,
  ElementType,
  Flow,
  Persona,
  Position,
  Project,
  Screen,
  Transition,
  TransitionKind,
} from "./schema";

export class ModelError extends Error {}

export function getFlow(p: Project, flowId: string): Flow {
  const f = p.flows.find((x) => x.id === flowId);
  if (!f) throw new ModelError(`Flow ${flowId} not found`);
  return f;
}
export function getScreen(f: Flow, screenId: string): Screen {
  const s = f.screens.find((x) => x.id === screenId);
  if (!s) throw new ModelError(`Screen ${screenId} not found`);
  return s;
}
export function getTransition(f: Flow, transitionId: string): Transition {
  const t = f.transitions.find((x) => x.id === transitionId);
  if (!t) throw new ModelError(`Transition ${transitionId} not found`);
  return t;
}
export function findElement(f: Flow, elementId: string): { screen: Screen; element: Element; index: number } | undefined {
  for (const screen of f.screens) {
    const index = screen.elements.findIndex((e) => e.id === elementId);
    if (index >= 0) return { screen, element: screen.elements[index]!, index };
  }
  return undefined;
}

/** Default label/props for a freshly added element of a given type. */
export function defaultElement(type: ElementType): Pick<Element, "label" | "props"> {
  switch (type) {
    case "header": return { label: "Screen title", props: {} };
    case "heading": return { label: "Heading", props: {} };
    case "text": return { label: "Body text", props: { text: "Short supporting copy." } };
    case "image-placeholder": return { label: "Image", props: {} };
    case "button-primary": return { label: "Continue", props: {} };
    case "button-secondary": return { label: "Cancel", props: {} };
    case "text-input": return { label: "Label", props: { placeholder: "Placeholder" } };
    case "textarea": return { label: "Message", props: { placeholder: "Type here…" } };
    case "checkbox": return { label: "Checkbox option", props: { checked: false } };
    case "radio": return { label: "Choose one", props: { items: ["Option A", "Option B"] } };
    case "toggle": return { label: "Setting", props: { checked: true } };
    case "select": return { label: "Select", props: { placeholder: "Choose…", items: ["Option A", "Option B"] } };
    case "list": return { label: "List", props: { items: ["Item one", "Item two", "Item three"] } };
    case "card": return { label: "Card title", props: { text: "Card detail" } };
    case "tabs": return { label: "Tabs", props: { items: ["Tab one", "Tab two"] } };
    case "nav-bar": return { label: "Navigation", props: { items: ["Home", "Search", "Profile"] } };
    case "search": return { label: "Search", props: { placeholder: "Search…" } };
    case "banner": return { label: "Banner", props: { text: "Informational message" } };
    case "toast": return { label: "Saved", props: {} };
    case "divider": return { label: "", props: {} };
    case "spacer": return { label: "", props: {} };
    case "icon-placeholder": return { label: "Icon", props: {} };
    case "progress": return { label: "Progress", props: { value: 40 } };
    case "form-error": return { label: "Something went wrong. Try again.", props: {} };
  }
}

// ---------- Flows ----------

export function addFlow(p: Project, flow: Flow): string {
  const existing = p.flows.findIndex((f) => f.id === flow.id);
  repairFlow(flow);
  if (existing >= 0) p.flows[existing] = flow;
  else p.flows.push(flow);
  return flow.id;
}

export function deleteFlow(p: Project, flowId: string): void {
  p.flows = p.flows.filter((f) => f.id !== flowId);
}

export function updateFlowMeta(
  p: Project,
  flowId: string,
  patch: Partial<Pick<Flow, "title" | "goal" | "notes" | "platform" | "personaId">>,
): void {
  Object.assign(getFlow(p, flowId), patch);
}

export function setStartScreen(p: Project, flowId: string, screenId: string): void {
  const f = getFlow(p, flowId);
  getScreen(f, screenId);
  f.startScreenId = screenId;
}

export function setPositions(p: Project, flowId: string, positions: Record<string, Position>): void {
  const f = getFlow(p, flowId);
  for (const s of f.screens) {
    const pos = positions[s.id];
    if (pos) s.position = { x: pos.x, y: pos.y };
  }
}

// ---------- Screens ----------

export function addScreen(
  p: Project,
  flowId: string,
  init: Partial<Omit<Screen, "id">> = {},
): string {
  const f = getFlow(p, flowId);
  const id = newId("scr");
  const last = f.screens[f.screens.length - 1];
  f.screens.push({
    id,
    title: init.title ?? "New screen",
    purpose: init.purpose ?? "",
    kind: init.kind ?? "screen",
    elements: init.elements ?? [{ id: newId("el"), type: "header", label: init.title ?? "New screen", props: {} }],
    annotations: init.annotations ?? [],
    position: init.position ?? (last ? { x: last.position.x + 280, y: last.position.y } : { x: 0, y: 0 }),
  });
  if (f.screens.length === 1) f.startScreenId = id;
  return id;
}

export function updateScreen(
  p: Project,
  flowId: string,
  screenId: string,
  patch: Partial<Pick<Screen, "title" | "purpose" | "kind">>,
): void {
  Object.assign(getScreen(getFlow(p, flowId), screenId), patch);
}

export function moveScreen(p: Project, flowId: string, screenId: string, position: Position): void {
  getScreen(getFlow(p, flowId), screenId).position = { x: position.x, y: position.y };
}

/** Deletes a screen, every transition touching it, and any linkTo pointing at those transitions. */
export function deleteScreen(p: Project, flowId: string, screenId: string): void {
  const f = getFlow(p, flowId);
  f.screens = f.screens.filter((s) => s.id !== screenId);
  f.transitions = f.transitions.filter((t) => t.from !== screenId && t.to !== screenId);
  repairFlow(f);
}

/** Copies a screen with fresh ids. Outgoing links are not copied (the copy starts unlinked). */
export function duplicateScreen(p: Project, flowId: string, screenId: string): string {
  const f = getFlow(p, flowId);
  const src = getScreen(f, screenId);
  const idMap = new Map<string, string>();
  const elements = src.elements.map((e) => {
    const id = newId("el");
    idMap.set(e.id, id);
    const { linkTo: _drop, ...rest } = e;
    return { ...rest, id, props: JSON.parse(JSON.stringify(e.props)) as ElementProps };
  });
  const annotations = src.annotations.map((a) => ({
    ...a,
    id: newId("an"),
    targetElementId: a.targetElementId ? idMap.get(a.targetElementId) : undefined,
  }));
  for (const a of annotations) if (a.targetElementId === undefined) delete a.targetElementId;
  const id = newId("scr");
  const index = f.screens.findIndex((s) => s.id === screenId);
  f.screens.splice(index + 1, 0, {
    id,
    title: `${src.title} (copy)`,
    purpose: src.purpose,
    kind: src.kind,
    elements,
    annotations,
    position: { x: src.position.x + 40, y: src.position.y + 40 },
  });
  return id;
}

// ---------- Elements ----------

export function addElement(
  p: Project,
  flowId: string,
  screenId: string,
  type: ElementType,
  index?: number,
  init: Partial<Pick<Element, "label" | "props">> = {},
): string {
  const s = getScreen(getFlow(p, flowId), screenId);
  const d = defaultElement(type);
  const el: Element = { id: newId("el"), type, label: init.label ?? d.label, props: init.props ?? d.props };
  const at = index === undefined ? s.elements.length : Math.max(0, Math.min(index, s.elements.length));
  s.elements.splice(at, 0, el);
  return el.id;
}

export function updateElement(
  p: Project,
  flowId: string,
  elementId: string,
  patch: { type?: ElementType; label?: string; props?: ElementProps },
): void {
  const f = getFlow(p, flowId);
  const found = findElement(f, elementId);
  if (!found) throw new ModelError(`Element ${elementId} not found`);
  if (patch.type !== undefined) found.element.type = patch.type;
  if (patch.label !== undefined) found.element.label = patch.label;
  if (patch.props !== undefined) found.element.props = patch.props;
}

/** Deletes an element; clears the trigger link on its transition and annotation pins targeting it. */
export function deleteElement(p: Project, flowId: string, elementId: string): void {
  const f = getFlow(p, flowId);
  const found = findElement(f, elementId);
  if (!found) return;
  found.screen.elements.splice(found.index, 1);
  repairFlow(f);
}

/**
 * Moves an element within a screen or to another screen. If the element fires a
 * transition, that transition now starts from the destination screen.
 */
export function moveElement(p: Project, flowId: string, elementId: string, toScreenId: string, toIndex: number): void {
  const f = getFlow(p, flowId);
  const found = findElement(f, elementId);
  if (!found) throw new ModelError(`Element ${elementId} not found`);
  const dest = getScreen(f, toScreenId);
  const [el] = found.screen.elements.splice(found.index, 1);
  const at = Math.max(0, Math.min(toIndex, dest.elements.length));
  dest.elements.splice(at, 0, el!);
  if (found.screen.id !== dest.id) {
    for (const a of found.screen.annotations) if (a.targetElementId === elementId) delete a.targetElementId;
    if (el!.linkTo) {
      const t = f.transitions.find((x) => x.id === el!.linkTo);
      if (t) t.from = dest.id;
    }
    repairFlow(f);
  }
}

// ---------- Transitions ----------

export interface TransitionInit {
  from: string;
  to: string;
  trigger?: string;
  kind?: TransitionKind;
  condition?: string;
  triggerElementId?: string;
}

function bindTrigger(f: Flow, t: Transition, elementId: string | undefined): void {
  // Unlink whatever the transition was bound to before.
  if (t.triggerElementId) {
    const prev = findElement(f, t.triggerElementId);
    if (prev && prev.element.linkTo === t.id) delete prev.element.linkTo;
  }
  if (elementId === undefined) {
    delete t.triggerElementId;
    return;
  }
  const found = findElement(f, elementId);
  if (!found || found.screen.id !== t.from) throw new ModelError(`Element ${elementId} is not on screen ${t.from}`);
  // An element fires at most one transition: steal it from any other.
  if (found.element.linkTo && found.element.linkTo !== t.id) {
    const other = f.transitions.find((x) => x.id === found.element.linkTo);
    if (other) delete other.triggerElementId;
  }
  t.triggerElementId = elementId;
  found.element.linkTo = t.id;
}

export function addTransition(p: Project, flowId: string, init: TransitionInit): string {
  const f = getFlow(p, flowId);
  getScreen(f, init.from);
  const toScreen = getScreen(f, init.to);
  const t: Transition = {
    id: newId("tr"),
    from: init.from,
    to: init.to,
    trigger: init.trigger ?? `Go to "${toScreen.title}"`,
    kind: init.kind ?? "happy",
    annotations: [],
  };
  if (init.condition) t.condition = init.condition;
  f.transitions.push(t);
  const draft = f.transitions[f.transitions.length - 1]!;
  if (init.triggerElementId) bindTrigger(f, draft, init.triggerElementId);
  return t.id;
}

export function updateTransition(
  p: Project,
  flowId: string,
  transitionId: string,
  patch: { trigger?: string; kind?: TransitionKind; condition?: string | null; to?: string; from?: string; triggerElementId?: string | null },
): void {
  const f = getFlow(p, flowId);
  const t = getTransition(f, transitionId);
  if (patch.trigger !== undefined) t.trigger = patch.trigger;
  if (patch.kind !== undefined) t.kind = patch.kind;
  if (patch.condition !== undefined) {
    if (patch.condition === null || patch.condition === "") delete t.condition;
    else t.condition = patch.condition;
  }
  if (patch.to !== undefined) {
    getScreen(f, patch.to);
    t.to = patch.to;
  }
  if (patch.from !== undefined && patch.from !== t.from) {
    getScreen(f, patch.from);
    bindTrigger(f, t, undefined);
    t.from = patch.from;
  }
  if (patch.triggerElementId !== undefined) bindTrigger(f, t, patch.triggerElementId ?? undefined);
}

/** Deletes a transition and clears the linkTo on the element that fired it. */
export function deleteTransition(p: Project, flowId: string, transitionId: string): void {
  const f = getFlow(p, flowId);
  f.transitions = f.transitions.filter((t) => t.id !== transitionId);
  for (const s of f.screens) for (const e of s.elements) if (e.linkTo === transitionId) delete e.linkTo;
}

/**
 * "Link to screen…": makes `elementId` fire a transition to `target`. Reuses the
 * element's existing transition when it has one, otherwise creates one. Passing
 * `{ newScreenTitle }` creates the destination screen first. Returns the transition id.
 */
export function linkElementToScreen(
  p: Project,
  flowId: string,
  elementId: string,
  target: { screenId: string } | { newScreenTitle: string },
  kind: TransitionKind = "happy",
): { transitionId: string; screenId: string } {
  const f = getFlow(p, flowId);
  const found = findElement(f, elementId);
  if (!found) throw new ModelError(`Element ${elementId} not found`);
  let screenId: string;
  if ("screenId" in target) {
    screenId = target.screenId;
  } else {
    const src = found.screen;
    screenId = addScreen(p, flowId, {
      title: target.newScreenTitle,
      position: { x: src.position.x + 300, y: src.position.y },
    });
  }
  const trigger = found.element.label ? `Tap "${found.element.label}"` : "Tap";
  if (found.element.linkTo) {
    const t = f.transitions.find((x) => x.id === found.element.linkTo);
    if (t) {
      t.to = screenId;
      return { transitionId: t.id, screenId };
    }
  }
  const transitionId = addTransition(p, flowId, { from: found.screen.id, to: screenId, trigger, kind, triggerElementId: elementId });
  return { transitionId, screenId };
}

export function unlinkElement(p: Project, flowId: string, elementId: string): void {
  const f = getFlow(p, flowId);
  const found = findElement(f, elementId);
  if (!found?.element.linkTo) return;
  const t = f.transitions.find((x) => x.id === found.element.linkTo);
  if (t) delete t.triggerElementId;
  delete found.element.linkTo;
}

// ---------- Annotations ----------

export type AnnotationOwner = { screenId: string } | { transitionId: string };

function ownerList(f: Flow, owner: AnnotationOwner): Annotation[] {
  return "screenId" in owner ? getScreen(f, owner.screenId).annotations : getTransition(f, owner.transitionId).annotations;
}

export function addAnnotation(
  p: Project,
  flowId: string,
  owner: AnnotationOwner,
  init: { type?: AnnotationType; text?: string; targetElementId?: string } = {},
): string {
  const f = getFlow(p, flowId);
  const list = ownerList(f, owner);
  const a: Annotation = { id: newId("an"), type: init.type ?? "rationale", text: init.text ?? "" };
  if (init.targetElementId && "screenId" in owner) {
    if (!getScreen(f, owner.screenId).elements.some((e) => e.id === init.targetElementId)) {
      throw new ModelError(`Element ${init.targetElementId} is not on screen ${owner.screenId}`);
    }
    a.targetElementId = init.targetElementId;
  }
  list.push(a);
  return a.id;
}

function findAnnotation(f: Flow, annotationId: string): { list: Annotation[]; index: number } | undefined {
  const lists = [...f.screens.map((s) => s.annotations), ...f.transitions.map((t) => t.annotations)];
  for (const list of lists) {
    const index = list.findIndex((a) => a.id === annotationId);
    if (index >= 0) return { list, index };
  }
  return undefined;
}

export function updateAnnotation(
  p: Project,
  flowId: string,
  annotationId: string,
  patch: { type?: AnnotationType; text?: string; targetElementId?: string | null },
): void {
  const f = getFlow(p, flowId);
  const found = findAnnotation(f, annotationId);
  if (!found) throw new ModelError(`Annotation ${annotationId} not found`);
  const a = found.list[found.index]!;
  if (patch.type !== undefined) a.type = patch.type;
  if (patch.text !== undefined) a.text = patch.text;
  if (patch.targetElementId === null) delete a.targetElementId;
  else if (patch.targetElementId !== undefined) a.targetElementId = patch.targetElementId;
  repairFlow(f);
}

export function deleteAnnotation(p: Project, flowId: string, annotationId: string): void {
  const f = getFlow(p, flowId);
  const found = findAnnotation(f, annotationId);
  if (found) found.list.splice(found.index, 1);
}

// ---------- Personas ----------

export function addPersona(p: Project, init: Partial<Omit<Persona, "id">> = {}): string {
  const id = newId("pe");
  p.personas.push({
    id,
    name: init.name ?? "New persona",
    role: init.role ?? "",
    goals: init.goals ?? [],
    context: init.context ?? "",
    skillLevel: init.skillLevel ?? "intermediate",
    constraints: init.constraints ?? [],
    painPoints: init.painPoints ?? [],
  });
  return id;
}

export function updatePersona(p: Project, personaId: string, patch: Partial<Omit<Persona, "id">>): void {
  const persona = p.personas.find((x) => x.id === personaId);
  if (!persona) throw new ModelError(`Persona ${personaId} not found`);
  Object.assign(persona, patch);
}

/** Deletes a persona; flows that used it keep working with no persona ("" id). */
export function deletePersona(p: Project, personaId: string): void {
  p.personas = p.personas.filter((x) => x.id !== personaId);
  for (const f of p.flows) if (f.personaId === personaId) f.personaId = "";
}
