/** System and user prompts for flow generation and refinement. */
import { ELEMENT_TYPES, type Persona } from "../src/model/schema";
import { flowToWire } from "../src/model/aiSchema";
import type { GenerateRequest, RefineAction, RefineRequest } from "../src/model/api";
import { contextBlock, type ContextFile } from "./context";

const ELEMENT_GUIDE: Record<(typeof ELEMENT_TYPES)[number], string> = {
  header: "top bar with the screen title (usually first)",
  heading: "section heading inside the page",
  text: "body copy; put the copy in detail",
  "image-placeholder": "gray box standing in for an image or illustration",
  "button-primary": "the one main action on the screen",
  "button-secondary": "secondary or cancel action, links",
  "text-input": "single-line field; label = field label, detail = placeholder",
  textarea: "multi-line field",
  checkbox: "single opt-in; detail on/off",
  radio: "one-of-many choice; items = options",
  toggle: "on/off setting; detail on/off",
  select: "dropdown; items = options, detail = placeholder",
  list: "repeating rows; items = row summaries",
  card: "grouped content block; detail = card body",
  tabs: "tab switcher; items = tab names",
  "nav-bar": "persistent app navigation; items = destinations (put last)",
  search: "search field; detail = placeholder",
  banner: "inline message or notice; detail = message",
  toast: "transient confirmation; detail = message",
  divider: "horizontal rule",
  spacer: "vertical gap",
  "icon-placeholder": "small icon with optional caption",
  progress: "progress or loading bar; detail = percent",
  "form-error": "inline validation or error message; label = the message",
};

const VOCAB = ELEMENT_TYPES.map((t) => `- ${t}: ${ELEMENT_GUIDE[t]}`).join("\n");

const SHARED_RULES = `You work in low fidelity. The output is rendered as grayscale wireframes, so:
- Use only this element vocabulary (no other types exist):
${VOCAB}
- Elements form a vertical stack, top to bottom. To put elements side by side (e.g. Cancel + Save), give consecutive elements the same "row" id. Never describe pixel positions, colors, fonts, imagery or brand styling; do not invent a brand or a product name.
- Write realistic, specific copy for labels, buttons and messages (not lorem ipsum).
- Screen kinds: "screen" for a full page, "modal" for dialogs and sheets, "state" for a variant of a screen (loading, empty, error, success), "external" for something outside the product (email inbox, OS dialog, third-party page).
- Every transition needs a trigger that says what the user does or what the system does (e.g. 'Tap "Send invite"', 'Server rejects email', 'Session expires'). When a user action fires it, set triggerElementId to that element's id on the from screen. Kinds: "happy" (main path), "error" (failure), "alternate" (a valid other route), "back" (return/cancel/retry to an earlier screen).
- Annotations explain WHY. Use "rationale" to tie a decision to the persona's goals, pain points or constraints (name them); "edge-case" for situations the design must handle; "open-question" for decisions a designer or PM still has to make; "tech-note" for technical assumptions or dependencies; "evidence" only when the provided context contains research that supports a decision (say which). Point targetElementId at the element a note is about when there is one. Prefer fewer, specific notes over generic ones.
- Ids: short, unique, readable (scr_review, el_review_submit, tr_submit). References between screens, transitions and elements must use these ids exactly.`;

export function generateSystemPrompt(): string {
  return `You are a senior UX designer sketching a low-fidelity user flow for a product team. Given a persona and a task, design the screens and transitions the persona moves through to complete the task, as a structured flow.

${SHARED_RULES}

Design approach:
- Start where the persona would realistically start, and end when the goal is achieved and confirmed.
- Keep the happy path as short as the task allows; each screen should have one clear purpose and one primary action.
- Respect the persona's skill level, constraints and platform (mobile: one column, thumb-reachable actions; desktop: room for more context, but still a single vertical stack per screen).
- Use the context files, when provided, as the source of truth for personas, principles and technical limits. If they conflict with the request, follow the context and add an open-question note.
- In "notes", list your key assumptions and what you deliberately left out.`;
}

function personaBlock(p: Persona | null): string {
  if (!p) return "No specific persona; design for a typical first-time user and note the assumption.";
  return [
    `Name: ${p.name}`,
    `Role: ${p.role}`,
    `Skill level: ${p.skillLevel}`,
    p.context && `Context: ${p.context}`,
    p.goals.length && `Goals:\n${p.goals.map((g) => `- ${g}`).join("\n")}`,
    p.constraints.length && `Constraints:\n${p.constraints.map((g) => `- ${g}`).join("\n")}`,
    p.painPoints.length && `Pain points:\n${p.painPoints.map((g) => `- ${g}`).join("\n")}`,
  ].filter(Boolean).join("\n");
}

export function generateUserPrompt(req: GenerateRequest, context: ContextFile[]): string {
  const scope =
    req.scope === "happy"
      ? "Scope: the happy path only. Include a loading or confirmation state only where the persona would otherwise be left guessing."
      : "Scope: happy path plus errors and edge cases. Include explicit loading, empty and error states (as \"state\" screens with error/alternate transitions and a way back) wherever they would realistically occur.";
  const ctx = contextBlock(context);
  return [
    ctx && `Project context files:\n\n${ctx}`,
    `<persona>\n${personaBlock(req.persona)}\n</persona>`,
    `<task>\n${req.task}\n</task>`,
    `Platform: ${req.platform}`,
    scope,
    req.extraContext.trim() && `<extra_context>\n${req.extraContext.trim()}\n</extra_context>`,
    "Produce the flow.",
  ].filter(Boolean).join("\n\n");
}

const ACTION_BRIEF: Record<RefineAction, string> = {
  "add-error-states": "Add the missing error, empty and loading states (and the transitions into and back out of them). Do not change the happy path.",
  simplify: "Simplify the flow: remove or merge screens and steps that do not earn their place, and shorten the happy path, while keeping the goal reachable. Explain each removal in the summary.",
  "suggest-missing": "Add the screens or interactions that are missing for this persona to complete the goal confidently (e.g. confirmation, undo, help, recovery, permissions, onboarding hints). Keep additions minimal and justify them with rationale notes.",
  "rewrite-annotations": "Rewrite the annotations to be more specific: tie each rationale to a named persona goal, pain point or constraint, make edge cases concrete, and phrase open questions so someone can answer them. Do not change screens, elements or transitions.",
  custom: "Follow the designer's instruction.",
};

export function refineSystemPrompt(): string {
  return `You are a senior UX designer refining an existing low-fidelity flow. You return a PATCH to the flow, not a new flow: only what changes.

${SHARED_RULES}

Patch rules:
- addScreens: new screens with new ids that don't exist yet. Connect them with addTransitions.
- updateScreens: existing screen ids. Use null for fields you aren't changing. "elements" and "annotations" are full replacement lists when given; keep the existing element ids for elements you keep so their links survive.
- removeScreenIds / removeTransitionIds: existing ids. Removing a screen also removes its transitions; add replacement transitions if the path would break.
- addTransitions may connect any existing or new screen; updateTransitions uses existing transition ids and null for unchanged fields.
- Leave everything else alone. An empty patch with a summary explaining why is fine when no change is warranted.`;
}

export function refineUserPrompt(req: RefineRequest, context: ContextFile[]): string {
  const focus = req.screenId ? req.flow.screens.find((s) => s.id === req.screenId) : undefined;
  const ctx = contextBlock(context);
  return [
    ctx && `Project context files:\n\n${ctx}`,
    `<persona>\n${personaBlock(req.persona)}\n</persona>`,
    `<current_flow platform="${req.flow.platform}">\n${JSON.stringify(flowToWire(req.flow), null, 1)}\n</current_flow>`,
    focus ? `Focus on the screen "${focus.title}" (id ${focus.id}) and what connects to it.` : "Consider the whole flow.",
    `Task: ${ACTION_BRIEF[req.action]}`,
    req.instruction.trim() && `<designer_instruction>\n${req.instruction.trim()}\n</designer_instruction>`,
  ].filter(Boolean).join("\n\n");
}
