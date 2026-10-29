/**
 * Applying and describing "Refine with AI" patches. A patch edits the existing
 * flow in place (it never regenerates it) and is applied as one undoable step.
 */
import { newId } from "./ids";
import { repairFlow } from "./integrity";
import { IdMapper, wireAnnotation, wireElementToElement, wireScreenToScreen, type RefinePatch } from "./aiSchema";
import { deleteScreen, deleteTransition, getFlow } from "./ops";
import type { Flow, Project, Transition } from "./schema";

/** Reference problems in a patch, relative to the flow it targets. Empty = OK. */
export function refinePatchProblems(flow: Flow, patch: RefinePatch): string[] {
  const problems: string[] = [];
  const existingScreens = new Set(flow.screens.map((s) => s.id));
  const existingTransitions = new Set(flow.transitions.map((t) => t.id));
  const newScreens = new Set(patch.addScreens.map((s) => s.id));
  const removed = new Set(patch.removeScreenIds);
  const alive = (id: string) => (existingScreens.has(id) && !removed.has(id)) || newScreens.has(id);
  for (const s of patch.addScreens) if (existingScreens.has(s.id)) problems.push(`addScreens id "${s.id}" already exists; use a new id.`);
  for (const s of patch.updateScreens) if (!existingScreens.has(s.id)) problems.push(`updateScreens id "${s.id}" does not exist.`);
  for (const id of patch.removeScreenIds) if (!existingScreens.has(id)) problems.push(`removeScreenIds "${id}" does not exist.`);
  for (const id of patch.removeTransitionIds) if (!existingTransitions.has(id)) problems.push(`removeTransitionIds "${id}" does not exist.`);
  for (const t of patch.updateTransitions) {
    if (!existingTransitions.has(t.id)) problems.push(`updateTransitions id "${t.id}" does not exist.`);
    if (t.to !== null && !alive(t.to)) problems.push(`updateTransitions ${t.id} points to unknown screen "${t.to}".`);
  }
  for (const t of patch.addTransitions) {
    if (!alive(t.from)) problems.push(`addTransitions ${t.id} has unknown from "${t.from}".`);
    if (!alive(t.to)) problems.push(`addTransitions ${t.id} has unknown to "${t.to}".`);
  }
  if (removed.has(flow.startScreenId) && flow.screens.length - removed.size + newScreens.size <= 0) {
    problems.push("The patch would remove every screen.");
  }
  return problems;
}

export interface DiffSummary {
  added: string[];
  changed: string[];
  removed: string[];
}

export function describePatch(flow: Flow, patch: RefinePatch): DiffSummary {
  const title = (id: string) =>
    flow.screens.find((s) => s.id === id)?.title ?? patch.addScreens.find((s) => s.id === id)?.title ?? id;
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];
  for (const s of patch.addScreens) added.push(`Screen "${s.title}" (${s.kind}, ${s.elements.length} elements)`);
  for (const t of patch.addTransitions) added.push(`Transition ${title(t.from)} → ${title(t.to)}: ${t.trigger} [${t.kind}]`);
  for (const u of patch.updateScreens) {
    const s = flow.screens.find((x) => x.id === u.id);
    if (!s) continue;
    const parts: string[] = [];
    if (u.title !== null && u.title !== s.title) parts.push(`renamed to "${u.title}"`);
    if (u.kind !== null && u.kind !== s.kind) parts.push(`kind ${s.kind} → ${u.kind}`);
    if (u.purpose !== null && u.purpose !== s.purpose) parts.push("purpose updated");
    if (u.elements !== null) {
      const before = new Set(s.elements.map((e) => e.id));
      const after = new Set(u.elements.map((e) => e.id));
      const add = u.elements.filter((e) => !before.has(e.id)).length;
      const del = s.elements.filter((e) => !after.has(e.id)).length;
      const edited = u.elements.filter((e) => {
        const old = s.elements.find((x) => x.id === e.id);
        return old && (old.label !== e.label || old.type !== e.type);
      }).length;
      if (add || del || edited) parts.push(`elements +${add} −${del} ~${edited}`);
    }
    if (u.annotations !== null) parts.push(`annotations ${s.annotations.length} → ${u.annotations.length}`);
    if (parts.length) changed.push(`Screen "${s.title}": ${parts.join(", ")}`);
  }
  for (const u of patch.updateTransitions) {
    const t = flow.transitions.find((x) => x.id === u.id);
    if (!t) continue;
    const parts: string[] = [];
    if (u.trigger !== null && u.trigger !== t.trigger) parts.push(`trigger "${u.trigger}"`);
    if (u.kind !== null && u.kind !== t.kind) parts.push(`kind ${t.kind} → ${u.kind}`);
    if (u.to !== null && u.to !== t.to) parts.push(`now goes to ${title(u.to)}`);
    if (u.condition !== null && u.condition !== (t.condition ?? null)) parts.push(`condition "${u.condition}"`);
    if (u.annotations !== null) parts.push(`annotations ${t.annotations.length} → ${u.annotations.length}`);
    if (parts.length) changed.push(`Transition ${title(t.from)} → ${title(t.to)}: ${parts.join(", ")}`);
  }
  for (const id of patch.removeScreenIds) {
    const n = flow.transitions.filter((t) => t.from === id || t.to === id).length;
    removed.push(`Screen "${title(id)}"${n ? ` and its ${n} transition${n > 1 ? "s" : ""}` : ""}`);
  }
  for (const id of patch.removeTransitionIds) {
    const t = flow.transitions.find((x) => x.id === id);
    if (t) removed.push(`Transition ${title(t.from)} → ${title(t.to)}: ${t.trigger}`);
  }
  return { added, changed, removed };
}

/** Applies a validated patch to the flow. Unknown references are skipped, never left dangling. */
export function applyRefinePatch(p: Project, flowId: string, patch: RefinePatch): void {
  const f = getFlow(p, flowId);
  const known = new Set<string>();
  for (const s of f.screens) {
    known.add(s.id);
    for (const e of s.elements) known.add(e.id);
  }
  for (const t of f.transitions) known.add(t.id);
  const ids = new IdMapper(known);

  for (const id of patch.removeTransitionIds) deleteTransition(p, flowId, id);
  for (const id of patch.removeScreenIds) if (f.screens.some((s) => s.id === id)) deleteScreen(p, flowId, id);

  for (const u of patch.updateScreens) {
    const s = f.screens.find((x) => x.id === u.id);
    if (!s) continue;
    if (u.title !== null) s.title = u.title;
    if (u.purpose !== null) s.purpose = u.purpose;
    if (u.kind !== null) s.kind = u.kind;
    if (u.elements !== null) {
      const local = new Set(s.elements.map((e) => e.id));
      s.elements = u.elements.map((w) => {
        const id = local.has(w.id) ? w.id : ids.get(w.id, "el");
        return wireElementToElement(w, id);
      });
    }
    if (u.annotations !== null) {
      const local = new Set(s.elements.map((e) => e.id));
      s.annotations = u.annotations.map((a) => wireAnnotation(a, (id) => {
        const m = ids.lookup(id);
        return m && local.has(m) ? m : undefined;
      }));
    }
  }

  // Place new screens to the right of their first incoming source, stacked downwards.
  const maxX = Math.max(0, ...f.screens.map((s) => s.position.x));
  patch.addScreens.forEach((w, i) => {
    const source = patch.addTransitions.find((t) => t.to === w.id && known.has(t.from));
    const anchor = source ? f.screens.find((s) => s.id === source.from) : undefined;
    const position = anchor
      ? { x: anchor.position.x + 300, y: anchor.position.y + 420 * (i + 1) }
      : { x: maxX + 300, y: 420 * i };
    f.screens.push(wireScreenToScreen(w, ids, position));
  });

  const screenIds = new Set(f.screens.map((s) => s.id));
  for (const w of patch.addTransitions) {
    const from = ids.lookup(w.from);
    const to = ids.lookup(w.to);
    if (!from || !to || !screenIds.has(from) || !screenIds.has(to)) continue;
    const t: Transition = {
      id: newId("tr"),
      from,
      to,
      trigger: w.trigger,
      kind: w.kind,
      annotations: w.annotations.map((a) => wireAnnotation(a, () => undefined)),
    };
    if (w.condition) t.condition = w.condition;
    const trig = w.triggerElementId ? ids.lookup(w.triggerElementId) : undefined;
    if (trig) {
      // Steal the trigger from any other transition; repairFlow then rebuilds linkTo.
      for (const other of f.transitions) if (other.triggerElementId === trig) delete other.triggerElementId;
      t.triggerElementId = trig;
    }
    f.transitions.push(t);
  }

  for (const u of patch.updateTransitions) {
    const t = f.transitions.find((x) => x.id === u.id);
    if (!t) continue;
    if (u.trigger !== null) t.trigger = u.trigger;
    if (u.kind !== null) t.kind = u.kind;
    if (u.condition !== null) {
      if (u.condition === "") delete t.condition;
      else t.condition = u.condition;
    }
    if (u.to !== null) {
      const to = ids.lookup(u.to);
      if (to && screenIds.has(to)) t.to = to;
    }
    if (u.annotations !== null) t.annotations = u.annotations.map((a) => wireAnnotation(a, () => undefined));
  }

  repairFlow(f);
}
