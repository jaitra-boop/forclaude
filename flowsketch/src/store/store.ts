/**
 * The one store. It holds the Project (the single source of truth), the shared
 * selection, and an undo/redo history of immer patches. Both views read from it
 * and write through `actions`, which wrap the pure ops in src/model/ops.ts.
 */
import { create } from "zustand";
import { applyPatches, enablePatches, produceWithPatches, type Patch } from "immer";
import * as ops from "../model/ops";
import { applyRefinePatch } from "../model/refine";
import { autoLayout } from "../model/layout";
import type { RefinePatch } from "../model/aiSchema";
import type { PathChoices } from "../model/paths";
import type { Flow, Project } from "../model/schema";

enablePatches();

export type Selection =
  | { kind: "screen"; id: string }
  | { kind: "transition"; id: string }
  | { kind: "element"; id: string; screenId: string }
  | { kind: "annotation"; id: string; screenId?: string; transitionId?: string }
  | null;

export type ViewMode = "flow" | "storyboard" | "split";

interface HistoryEntry {
  label: string;
  patches: Patch[];
  inverse: Patch[];
  /** Consecutive edits with the same key (a drag, typing in one field) merge into one undo step. */
  coalesceKey?: string;
  at: number;
}

const HISTORY_LIMIT = 200;
const COALESCE_MS = 1500;

export interface StoreState {
  project: Project;
  activeFlowId: string;
  selection: Selection;
  view: ViewMode;
  /** Screen open in the screen editor panel (double-click in flow view, or click a frame). */
  editorScreenId: string | null;
  /** Storyboard branch choices per flow. UI state only, not part of the model. */
  pathChoices: Record<string, PathChoices>;
  past: HistoryEntry[];
  future: HistoryEntry[];
  /** Bumped on every model change; autosave listens to it. */
  revision: number;
}

const initial = (project: Project): StoreState => ({
  project,
  activeFlowId: project.flows[0]?.id ?? "",
  selection: null,
  view: "split",
  editorScreenId: null,
  pathChoices: {},
  past: [],
  future: [],
  revision: 0,
});

const emptyProject: Project = { id: "pr_empty", name: "default", personas: [], flows: [] };

export const useStore = create<StoreState>()(() => initial(emptyProject));

const get = () => useStore.getState();
const set = useStore.setState;

/**
 * Runs a model recipe as one undoable step. Returns whatever the recipe returns.
 * If the recipe throws, the model is left untouched.
 */
export function commit<T>(label: string, recipe: (draft: Project) => T, coalesceKey?: string): T {
  let result!: T;
  const [next, patches, inverse] = produceWithPatches(get().project, (draft) => {
    result = recipe(draft as Project);
  });
  if (patches.length === 0) return result;
  const now = Date.now();
  const { past } = get();
  const last = past[past.length - 1];
  let newPast: HistoryEntry[];
  if (coalesceKey && last?.coalesceKey === coalesceKey && now - last.at < COALESCE_MS && get().future.length === 0) {
    newPast = [...past.slice(0, -1), { ...last, patches: [...last.patches, ...patches], inverse: [...inverse, ...last.inverse], at: now }];
  } else {
    newPast = [...past, { label, patches, inverse, coalesceKey, at: now }].slice(-HISTORY_LIMIT);
  }
  set((s) => ({ project: next, past: newPast, future: [], revision: s.revision + 1 }));
  pruneSelection();
  return result;
}

/** Clears selection / editor if what they point at no longer exists. */
function pruneSelection() {
  const { selection, editorScreenId } = get();
  const flow = activeFlow();
  if (!flow) {
    set({ selection: null, editorScreenId: null });
    return;
  }
  const screenIds = new Set(flow.screens.map((s) => s.id));
  const exists = (sel: Selection): boolean => {
    if (!sel) return true;
    switch (sel.kind) {
      case "screen": return screenIds.has(sel.id);
      case "transition": return flow.transitions.some((t) => t.id === sel.id);
      case "element": return flow.screens.some((s) => s.id === sel.screenId && s.elements.some((e) => e.id === sel.id));
      case "annotation":
        return flow.screens.some((s) => s.annotations.some((a) => a.id === sel.id)) ||
          flow.transitions.some((t) => t.annotations.some((a) => a.id === sel.id));
    }
  };
  const patch: Partial<StoreState> = {};
  if (!exists(selection)) patch.selection = null;
  if (editorScreenId && !screenIds.has(editorScreenId)) patch.editorScreenId = null;
  // An element may have moved to another screen: keep the selection, fix its screen.
  if (selection?.kind === "element" && !exists(selection)) {
    const found = ops.findElement(flow, selection.id);
    if (found) patch.selection = { kind: "element", id: selection.id, screenId: found.screen.id };
  }
  if (Object.keys(patch).length) set(patch);
}

export function activeFlow(state: StoreState = get()): Flow | undefined {
  return state.project.flows.find((f) => f.id === state.activeFlowId);
}

function fid(): string {
  const id = get().activeFlowId;
  if (!id) throw new ops.ModelError("No active flow");
  return id;
}

export const actions = {
  /** Replace the whole project (load from disk). Clears history. */
  load(project: Project) {
    set({ ...initial(project), view: get().view });
  },
  setView(view: ViewMode) { set({ view }); },
  setActiveFlow(flowId: string) { set({ activeFlowId: flowId, selection: null, editorScreenId: null }); },
  select(selection: Selection) { set({ selection }); },
  openEditor(screenId: string | null) { set({ editorScreenId: screenId, selection: screenId ? { kind: "screen", id: screenId } : get().selection }); },
  setPathChoice(screenId: string, transitionId: string) {
    const flowId = fid();
    const prev = get().pathChoices[flowId] ?? {};
    set({ pathChoices: { ...get().pathChoices, [flowId]: { ...prev, [screenId]: transitionId } } });
  },
  setPathChoices(choices: PathChoices) {
    set({ pathChoices: { ...get().pathChoices, [fid()]: choices } });
  },

  undo() {
    const { past, future, project } = get();
    const entry = past[past.length - 1];
    if (!entry) return;
    set((s) => ({ project: applyPatches(project, entry.inverse), past: past.slice(0, -1), future: [...future, entry], revision: s.revision + 1 }));
    pruneSelection();
  },
  redo() {
    const { past, future, project } = get();
    const entry = future[future.length - 1];
    if (!entry) return;
    set((s) => ({ project: applyPatches(project, entry.patches), past: [...past, { ...entry, coalesceKey: undefined }], future: future.slice(0, -1), revision: s.revision + 1 }));
    pruneSelection();
  },

  // ----- flows -----
  addFlow(flow: Flow) {
    commit("Add flow", (d) => ops.addFlow(d, flow));
    set({ activeFlowId: flow.id, selection: null, editorScreenId: null });
  },
  deleteFlow(flowId: string) {
    commit("Delete flow", (d) => ops.deleteFlow(d, flowId));
    if (get().activeFlowId === flowId) set({ activeFlowId: get().project.flows[0]?.id ?? "" });
  },
  updateFlowMeta(patch: Parameters<typeof ops.updateFlowMeta>[2]) {
    commit("Edit flow", (d) => ops.updateFlowMeta(d, fid(), patch), `flow-meta:${Object.keys(patch).join()}`);
  },
  autoLayout() {
    const flow = activeFlow();
    if (!flow) return;
    const positions = autoLayout(flow);
    commit("Auto-layout", (d) => ops.setPositions(d, fid(), positions));
  },
  applyRefinePatch(patch: RefinePatch) {
    commit("Refine with AI", (d) => applyRefinePatch(d, fid(), patch));
  },

  // ----- screens -----
  addScreen(init?: Parameters<typeof ops.addScreen>[2]) {
    const id = commit("Add screen", (d) => ops.addScreen(d, fid(), init));
    set({ selection: { kind: "screen", id } });
    return id;
  },
  updateScreen(screenId: string, patch: Parameters<typeof ops.updateScreen>[3]) {
    commit("Edit screen", (d) => ops.updateScreen(d, fid(), screenId, patch), `screen:${screenId}:${Object.keys(patch).join()}`);
  },
  moveScreen(screenId: string, position: { x: number; y: number }) {
    commit("Move screen", (d) => ops.moveScreen(d, fid(), screenId, position), `move:${screenId}`);
  },
  deleteScreen(screenId: string) { commit("Delete screen", (d) => ops.deleteScreen(d, fid(), screenId)); },
  duplicateScreen(screenId: string) {
    const id = commit("Duplicate screen", (d) => ops.duplicateScreen(d, fid(), screenId));
    set({ selection: { kind: "screen", id } });
    return id;
  },
  setStartScreen(screenId: string) { commit("Set start screen", (d) => ops.setStartScreen(d, fid(), screenId)); },

  // ----- elements -----
  addElement(screenId: string, type: Parameters<typeof ops.addElement>[3], index?: number) {
    const id = commit("Add element", (d) => ops.addElement(d, fid(), screenId, type, index));
    set({ selection: { kind: "element", id, screenId } });
    return id;
  },
  updateElement(elementId: string, patch: Parameters<typeof ops.updateElement>[3]) {
    commit("Edit element", (d) => ops.updateElement(d, fid(), elementId, patch), `element:${elementId}:${Object.keys(patch).join()}`);
  },
  deleteElement(elementId: string) { commit("Delete element", (d) => ops.deleteElement(d, fid(), elementId)); },
  moveElement(elementId: string, toScreenId: string, toIndex: number) {
    commit("Move element", (d) => ops.moveElement(d, fid(), elementId, toScreenId, toIndex));
  },
  duplicateElement(elementId: string) {
    const flow = activeFlow();
    const found = flow && ops.findElement(flow, elementId);
    if (!found) return;
    const id = commit("Duplicate element", (d) =>
      ops.addElement(d, fid(), found.screen.id, found.element.type, found.index + 1, {
        label: found.element.label,
        props: structuredClone(found.element.props),
      }),
    );
    set({ selection: { kind: "element", id, screenId: found.screen.id } });
  },
  linkElementToScreen(elementId: string, target: Parameters<typeof ops.linkElementToScreen>[3], kind?: Parameters<typeof ops.linkElementToScreen>[4]) {
    return commit("Link to screen", (d) => ops.linkElementToScreen(d, fid(), elementId, target, kind));
  },
  unlinkElement(elementId: string) { commit("Unlink element", (d) => ops.unlinkElement(d, fid(), elementId)); },

  // ----- transitions -----
  addTransition(init: ops.TransitionInit) {
    const id = commit("Add transition", (d) => ops.addTransition(d, fid(), init));
    set({ selection: { kind: "transition", id } });
    return id;
  },
  updateTransition(transitionId: string, patch: Parameters<typeof ops.updateTransition>[3]) {
    commit("Edit transition", (d) => ops.updateTransition(d, fid(), transitionId, patch), `transition:${transitionId}:${Object.keys(patch).join()}`);
  },
  deleteTransition(transitionId: string) { commit("Delete transition", (d) => ops.deleteTransition(d, fid(), transitionId)); },

  // ----- annotations -----
  addAnnotation(owner: ops.AnnotationOwner, init?: Parameters<typeof ops.addAnnotation>[3]) {
    const id = commit("Add annotation", (d) => ops.addAnnotation(d, fid(), owner, init));
    set({ selection: { kind: "annotation", id, ...owner } });
    return id;
  },
  updateAnnotation(annotationId: string, patch: Parameters<typeof ops.updateAnnotation>[3]) {
    commit("Edit annotation", (d) => ops.updateAnnotation(d, fid(), annotationId, patch), `annotation:${annotationId}:${Object.keys(patch).join()}`);
  },
  deleteAnnotation(annotationId: string) { commit("Delete annotation", (d) => ops.deleteAnnotation(d, fid(), annotationId)); },

  // ----- personas -----
  addPersona(init?: Parameters<typeof ops.addPersona>[1]) { return commit("Add persona", (d) => ops.addPersona(d, init)); },
  updatePersona(personaId: string, patch: Parameters<typeof ops.updatePersona>[2]) {
    commit("Edit persona", (d) => ops.updatePersona(d, personaId, patch), `persona:${personaId}:${Object.keys(patch).join()}`);
  },
  deletePersona(personaId: string) { commit("Delete persona", (d) => ops.deletePersona(d, personaId)); },

  // ----- selection-driven (keyboard) -----
  deleteSelection() {
    const sel = get().selection;
    if (!sel) return;
    switch (sel.kind) {
      case "screen": actions.deleteScreen(sel.id); break;
      case "transition": actions.deleteTransition(sel.id); break;
      case "element": actions.deleteElement(sel.id); break;
      case "annotation": actions.deleteAnnotation(sel.id); break;
    }
    set({ selection: null });
  },
  duplicateSelection() {
    const sel = get().selection;
    if (sel?.kind === "screen") actions.duplicateScreen(sel.id);
    else if (sel?.kind === "element") actions.duplicateElement(sel.id);
  },
};

export type Actions = typeof actions;
