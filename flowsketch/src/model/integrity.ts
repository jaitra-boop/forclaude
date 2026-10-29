/**
 * Reference integrity for a Flow. `checkIntegrity` reports dangling references;
 * `repairFlow` fixes them in place. Every delete op in ops.ts relies on these
 * invariants, and AI output is repaired before it enters the store.
 *
 * Invariants:
 *  - transition.from / .to name existing screens
 *  - startScreenId names an existing screen (when there are screens)
 *  - transition.triggerElementId names an element on the `from` screen, and that
 *    element's linkTo points back at the transition (and vice versa)
 *  - annotation.targetElementId names an element on the same screen
 *  - ids are unique within the flow
 */
import type { Flow, Project } from "./schema";

export interface IntegrityIssue {
  kind:
    | "transition-from"
    | "transition-to"
    | "start-screen"
    | "trigger-element"
    | "element-link"
    | "annotation-target"
    | "duplicate-id"
    | "persona";
  id: string;
  message: string;
}

export function checkIntegrity(flow: Flow): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const screens = new Map(flow.screens.map((s) => [s.id, s]));
  const transitions = new Map(flow.transitions.map((t) => [t.id, t]));
  const seen = new Set<string>();
  const markId = (id: string) => {
    if (seen.has(id)) issues.push({ kind: "duplicate-id", id, message: `Duplicate id ${id}` });
    seen.add(id);
  };

  if (flow.screens.length > 0 && !screens.has(flow.startScreenId)) {
    issues.push({ kind: "start-screen", id: flow.startScreenId, message: `Start screen ${flow.startScreenId} does not exist` });
  }

  for (const s of flow.screens) {
    markId(s.id);
    const elementIds = new Set(s.elements.map((e) => e.id));
    for (const e of s.elements) {
      markId(e.id);
      if (e.linkTo !== undefined) {
        const t = transitions.get(e.linkTo);
        if (!t || t.triggerElementId !== e.id || t.from !== s.id) {
          issues.push({ kind: "element-link", id: e.id, message: `Element ${e.id} links to missing or mismatched transition ${e.linkTo}` });
        }
      }
    }
    for (const a of s.annotations) {
      markId(a.id);
      if (a.targetElementId !== undefined && !elementIds.has(a.targetElementId)) {
        issues.push({ kind: "annotation-target", id: a.id, message: `Annotation ${a.id} targets missing element ${a.targetElementId}` });
      }
    }
  }

  for (const t of flow.transitions) {
    markId(t.id);
    for (const a of t.annotations) markId(a.id);
    const from = screens.get(t.from);
    if (!from) issues.push({ kind: "transition-from", id: t.id, message: `Transition ${t.id} starts at missing screen ${t.from}` });
    if (!screens.has(t.to)) issues.push({ kind: "transition-to", id: t.id, message: `Transition ${t.id} ends at missing screen ${t.to}` });
    if (t.triggerElementId !== undefined) {
      const el = from?.elements.find((e) => e.id === t.triggerElementId);
      if (!el || el.linkTo !== t.id) {
        issues.push({ kind: "trigger-element", id: t.id, message: `Transition ${t.id} trigger element ${t.triggerElementId} is missing or not linked back` });
      }
    }
  }
  return issues;
}

export function checkProjectIntegrity(project: Project): IntegrityIssue[] {
  const personaIds = new Set(project.personas.map((p) => p.id));
  const issues: IntegrityIssue[] = [];
  for (const f of project.flows) {
    issues.push(...checkIntegrity(f));
    if (f.personaId !== "" && !personaIds.has(f.personaId)) {
      issues.push({ kind: "persona", id: f.id, message: `Flow ${f.id} uses missing persona ${f.personaId}` });
    }
  }
  return issues;
}

/**
 * Removes or clears every dangling reference. Mutates and returns the flow
 * (works on plain objects and immer drafts alike).
 */
export function repairFlow(flow: Flow): Flow {
  const screenIds = new Set(flow.screens.map((s) => s.id));
  flow.transitions = flow.transitions.filter((t) => screenIds.has(t.from) && screenIds.has(t.to));

  if (flow.screens.length > 0 && !screenIds.has(flow.startScreenId)) {
    flow.startScreenId = flow.screens[0]!.id;
  }

  // Rebuild element.linkTo from transitions (transitions are authoritative).
  const elementOwner = new Map<string, string>();
  for (const s of flow.screens) {
    for (const e of s.elements) {
      elementOwner.set(e.id, s.id);
      delete e.linkTo;
    }
  }
  const claimed = new Set<string>();
  for (const t of flow.transitions) {
    if (t.triggerElementId === undefined) continue;
    if (elementOwner.get(t.triggerElementId) !== t.from || claimed.has(t.triggerElementId)) {
      delete t.triggerElementId;
      continue;
    }
    claimed.add(t.triggerElementId);
  }
  const byElement = new Map(flow.transitions.filter((t) => t.triggerElementId).map((t) => [t.triggerElementId!, t.id]));
  for (const s of flow.screens) {
    const elementIds = new Set(s.elements.map((e) => e.id));
    for (const e of s.elements) {
      const tid = byElement.get(e.id);
      if (tid) e.linkTo = tid;
    }
    for (const a of s.annotations) {
      if (a.targetElementId !== undefined && !elementIds.has(a.targetElementId)) delete a.targetElementId;
    }
  }
  return flow;
}
