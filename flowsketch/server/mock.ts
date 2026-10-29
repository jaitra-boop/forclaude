/**
 * Mock mode (no ANTHROPIC_API_KEY): generation returns the hand-written sample
 * flow; refinements return small canned patches computed against the flow sent,
 * so the whole UI (including accept/reject) works offline.
 */
import { SAMPLE_FLOW } from "../src/model/sample";
import { flowToWire, wireToFlow, type RefinePatch, type WireElement } from "../src/model/aiSchema";
import { computePath } from "../src/model/paths";
import type { GenerateRequest, RefineRequest } from "../src/model/api";
import type { Flow } from "../src/model/schema";

export function mockGenerate(req: GenerateRequest): Flow {
  const wire = flowToWire(SAMPLE_FLOW);
  if (req.scope === "happy") {
    // Drop the branch screens to honour the happy-path scope.
    const keep = new Set(["scr_members", "scr_invite", "scr_sending", "scr_sent"]);
    wire.screens = wire.screens.filter((s) => keep.has(s.id));
    wire.transitions = wire.transitions.filter((t) => keep.has(t.from) && keep.has(t.to));
  }
  wire.notes = `MOCK MODE: no ANTHROPIC_API_KEY set, so this is the built-in sample flow (your task was: "${req.task}"). ${wire.notes}`;
  return wireToFlow(wire, { personaId: req.persona?.id ?? "", platform: req.platform });
}

const empty = (summary: string): RefinePatch => ({
  summary, addScreens: [], updateScreens: [], removeScreenIds: [], addTransitions: [], updateTransitions: [], removeTransitionIds: [],
});

const el = (id: string, type: WireElement["type"], label: string, detail: string | null = null): WireElement => ({
  id, type, label, detail, items: null, row: null,
});

export function mockRefine(req: RefineRequest): RefinePatch {
  const flow = req.flow;
  const target = flow.screens.find((s) => s.id === req.screenId) ?? flow.screens.find((s) => s.id === flow.startScreenId) ?? flow.screens[0];
  if (!target) return empty("The flow has no screens to refine.");
  const tag = Math.random().toString(36).slice(2, 6);

  switch (req.action) {
    case "add-error-states": {
      const errId = `scr_err_${tag}`;
      const emptyId = `scr_empty_${tag}`;
      const p = empty(`(mock) Added an error state and an empty state for “${target.title}”.`);
      p.addScreens.push(
        {
          id: errId, title: `${target.title} — couldn't load`, purpose: "Recover from a failed request", kind: "state",
          elements: [el(`el_eh_${tag}`, "header", target.title), el(`el_ee_${tag}`, "form-error", "We couldn't reach the server. Your changes are saved on this device."), el(`el_er_${tag}`, "button-primary", "Try again")],
          annotations: [{ type: "edge-case", text: "Triggered by timeouts and offline mode; keep any typed input.", targetElementId: null }],
        },
        {
          id: emptyId, title: `${target.title} — empty`, purpose: "First-use state with nothing to show yet", kind: "state",
          elements: [el(`el_mh_${tag}`, "header", target.title), el(`el_mi_${tag}`, "image-placeholder", "Illustration"), el(`el_mt_${tag}`, "text", "Empty", "Nothing here yet. Start by adding your first item."), el(`el_mc_${tag}`, "button-primary", "Get started")],
          annotations: [{ type: "rationale", text: "Empty states teach the next step instead of showing a blank list.", targetElementId: null }],
        },
      );
      p.addTransitions.push(
        { id: `tr_err_${tag}`, from: target.id, to: errId, trigger: "Request fails", triggerElementId: null, kind: "error", condition: "Network error or timeout", annotations: [] },
        { id: `tr_retry_${tag}`, from: errId, to: target.id, trigger: 'Tap "Try again"', triggerElementId: `el_er_${tag}`, kind: "back", condition: null, annotations: [] },
        { id: `tr_empty_${tag}`, from: target.id, to: emptyId, trigger: "No data yet", triggerElementId: null, kind: "alternate", condition: "First visit", annotations: [] },
      );
      return p;
    }
    case "simplify": {
      const steps = computePath(flow);
      const idx = steps.findIndex((s, i) => i > 0 && i < steps.length - 1 && s.screen.kind === "state");
      if (idx < 0) return empty("(mock) No intermediate state screens on the happy path to merge; nothing to simplify.");
      const prev = steps[idx - 1]!;
      const mid = steps[idx]!;
      const next = steps[idx + 1]!;
      const p = empty(`(mock) Removed “${mid.screen.title}” and went straight from “${prev.screen.title}” to “${next.screen.title}”; show progress inline on the button instead.`);
      p.removeScreenIds.push(mid.screen.id);
      p.addTransitions.push({
        id: `tr_bridge_${tag}`, from: prev.screen.id, to: next.screen.id, trigger: prev.next?.trigger ?? "Continue",
        triggerElementId: prev.next?.triggerElementId ?? null, kind: "happy", condition: null,
        annotations: [{ type: "rationale", text: "One less screen: the loading state became an inline spinner.", targetElementId: null }],
      });
      // Keep error branches that left the removed screen by re-attaching them to the previous screen.
      for (const t of flow.transitions.filter((t) => t.from === mid.screen.id && t.to !== next.screen.id)) {
        p.addTransitions.push({ id: `tr_keep_${t.id}`, from: prev.screen.id, to: t.to, trigger: t.trigger, triggerElementId: null, kind: t.kind, condition: t.condition ?? null, annotations: [] });
      }
      return p;
    }
    case "suggest-missing": {
      const helpId = `scr_help_${tag}`;
      const wire = flowToWire(flow).screens.find((s) => s.id === target.id)!;
      const btnId = `el_help_${tag}`;
      const p = empty(`(mock) Added a “Need help?” route from “${target.title}”.`);
      p.updateScreens.push({ id: target.id, title: null, purpose: null, kind: null, elements: [...wire.elements, el(btnId, "button-secondary", "Need help?")], annotations: null });
      p.addScreens.push({
        id: helpId, title: "Help", purpose: "Explain the step without leaving the task", kind: "modal",
        elements: [el(`el_hh_${tag}`, "heading", "How this works"), el(`el_ht_${tag}`, "text", "Explanation", "A short, plain-language explanation of this step."), el(`el_hc_${tag}`, "button-primary", "Got it")],
        annotations: [{ type: "open-question", text: "Is inline help enough, or do we need a link to docs?", targetElementId: null }],
      });
      p.addTransitions.push(
        { id: `tr_help_${tag}`, from: target.id, to: helpId, trigger: 'Tap "Need help?"', triggerElementId: btnId, kind: "alternate", condition: null, annotations: [] },
        { id: `tr_helpback_${tag}`, from: helpId, to: target.id, trigger: 'Tap "Got it"', triggerElementId: `el_hc_${tag}`, kind: "back", condition: null, annotations: [] },
      );
      return p;
    }
    case "rewrite-annotations": {
      const pain = req.persona?.painPoints[0];
      const goal = req.persona?.goals[0];
      const p = empty(`(mock) Made the notes on “${target.title}” reference the persona explicitly.`);
      p.updateScreens.push({
        id: target.id, title: null, purpose: null, kind: null, elements: null,
        annotations: target.annotations.map((a) => ({
          type: a.type,
          targetElementId: a.targetElementId ?? null,
          text: a.type === "rationale" && (pain || goal)
            ? `${a.text} (Addresses ${req.persona?.name ?? "the persona"}'s ${pain ? `pain point “${pain}”` : `goal “${goal}”`}.)`
            : a.type === "open-question" ? `${a.text} Owner: PM. Decide before hi-fi.` : a.text,
        })),
      });
      return p;
    }
    case "custom": {
      const p = empty(`(mock) Recorded your instruction as an open question on “${target.title}”. Set ANTHROPIC_API_KEY for real refinements.`);
      const wire = flowToWire(flow).screens.find((s) => s.id === target.id)!;
      p.updateScreens.push({
        id: target.id, title: null, purpose: null, kind: null, elements: null,
        annotations: [...wire.annotations, { type: "open-question", text: `Instruction: ${req.instruction || "(empty)"}`, targetElementId: null }],
      });
      return p;
    }
  }
}
