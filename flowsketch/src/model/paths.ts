/**
 * Storyboard path computation. A path is a walk from the start screen that
 * follows one outgoing transition per screen. `choices` pins which transition
 * to take at a branch point; otherwise the preferred kind wins (happy first).
 * Every walk tracks visited screens, so loops end instead of hanging.
 */
import type { Flow, Screen, Transition, TransitionKind } from "./schema";

export type PathChoices = Record<string, string>; // screenId -> transitionId

export interface PathStep {
  screen: Screen;
  /** Transition taken to leave this screen (undefined on the last step). */
  next?: Transition;
  /** Outgoing transitions from this screen other than `next` (branch alternatives). */
  alternatives: Transition[];
  /** Set when `next` returns to a screen already on the path. */
  loopsBackTo?: Screen;
}

const KIND_ORDER: TransitionKind[] = ["happy", "alternate", "error", "back"];

export function outgoing(flow: Flow, screenId: string): Transition[] {
  return flow.transitions.filter((t) => t.from === screenId);
}

function pickDefault(options: Transition[], prefer: TransitionKind): Transition | undefined {
  const order = [prefer, ...KIND_ORDER.filter((k) => k !== prefer)];
  for (const kind of order) {
    // Back edges are only followed if they're the only way forward.
    if (kind === "back" && prefer !== "back" && options.some((o) => o.kind !== "back")) continue;
    const hit = options.find((o) => o.kind === kind);
    if (hit) return hit;
  }
  return options[0];
}

export function computePath(flow: Flow, choices: PathChoices = {}, prefer: TransitionKind = "happy"): PathStep[] {
  const screens = new Map(flow.screens.map((s) => [s.id, s]));
  const steps: PathStep[] = [];
  const visited = new Set<string>();
  let current = screens.get(flow.startScreenId) ?? flow.screens[0];
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const options = outgoing(flow, current.id).filter((t) => screens.has(t.to));
    const chosenId = choices[current.id];
    const next = options.find((t) => t.id === chosenId) ?? pickDefault(options, prefer);
    const step: PathStep = { screen: current, next, alternatives: options.filter((t) => t !== next) };
    steps.push(step);
    if (!next) break;
    const target = screens.get(next.to);
    if (target && visited.has(target.id)) {
      step.loopsBackTo = target;
      break;
    }
    current = target;
  }
  return steps;
}

export interface NamedPath {
  label: string;
  choices: PathChoices;
  screenIds: string[];
  kinds: TransitionKind[];
}

/**
 * Enumerates distinct simple paths from the start screen (DFS, no screen twice,
 * capped by `limit`) and names them by the first non-happy transition they take.
 */
export function enumeratePaths(flow: Flow, limit = 24): NamedPath[] {
  const screens = new Map(flow.screens.map((s) => [s.id, s]));
  const start = screens.get(flow.startScreenId) ?? flow.screens[0];
  if (!start) return [];
  const results: NamedPath[] = [];
  const visit = (screenId: string, visited: Set<string>, choices: PathChoices, taken: Transition[]) => {
    if (results.length >= limit) return;
    const options = outgoing(flow, screenId).filter((t) => screens.has(t.to) && !visited.has(t.to));
    if (options.length === 0) {
      results.push({
        label: nameFor(taken, screens),
        choices: { ...choices },
        screenIds: [...visited],
        kinds: taken.map((t) => t.kind),
      });
      return;
    }
    const sorted = [...options].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    for (const t of sorted) {
      if (results.length >= limit) return;
      const nextVisited = new Set(visited).add(t.to);
      visit(t.to, nextVisited, { ...choices, [screenId]: t.id }, [...taken, t]);
    }
  };
  visit(start.id, new Set([start.id]), {}, []);
  // Happy-only first, then by length; disambiguate repeated names.
  results.sort((a, b) => score(a) - score(b) || a.screenIds.length - b.screenIds.length);
  const seen = new Map<string, number>();
  for (const r of results) {
    const n = (seen.get(r.label) ?? 0) + 1;
    seen.set(r.label, n);
    if (n > 1) r.label = `${r.label} #${n}`;
  }
  return results;
}

function score(p: NamedPath): number {
  return p.kinds.filter((k) => k !== "happy").length;
}

function nameFor(taken: Transition[], screens: Map<string, Screen>): string {
  const branch = taken.find((t) => t.kind !== "happy");
  if (!branch) return "Happy path";
  const kind = branch.kind[0]!.toUpperCase() + branch.kind.slice(1);
  return `${kind}: ${screens.get(branch.to)?.title ?? branch.trigger}`;
}

/** Screens the current path never shows (so the storyboard can still list them). */
export function offPathScreens(flow: Flow, steps: PathStep[]): Screen[] {
  const on = new Set(steps.map((s) => s.screen.id));
  return flow.screens.filter((s) => !on.has(s.id));
}
