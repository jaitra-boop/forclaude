/**
 * The single source of truth for FlowSketch.
 *
 * Every view (flow diagram, storyboard, exports) is a pure function of a
 * `Project` shaped by these schemas. The same Zod schemas validate AI output
 * (see aiSchema.ts) and project files on disk (see server/projects.ts).
 */
import { z } from "zod";

export const ELEMENT_TYPES = [
  "header",
  "heading",
  "text",
  "image-placeholder",
  "button-primary",
  "button-secondary",
  "text-input",
  "textarea",
  "checkbox",
  "radio",
  "toggle",
  "select",
  "list",
  "card",
  "tabs",
  "nav-bar",
  "search",
  "banner",
  "toast",
  "divider",
  "spacer",
  "icon-placeholder",
  "progress",
  "form-error",
] as const;
export const ElementType = z.enum(ELEMENT_TYPES);
export type ElementType = z.infer<typeof ElementType>;

export const ANNOTATION_TYPES = ["rationale", "edge-case", "open-question", "tech-note", "evidence"] as const;
export const AnnotationType = z.enum(ANNOTATION_TYPES);
export type AnnotationType = z.infer<typeof AnnotationType>;

export const TRANSITION_KINDS = ["happy", "error", "alternate", "back"] as const;
export const TransitionKind = z.enum(TRANSITION_KINDS);
export type TransitionKind = z.infer<typeof TransitionKind>;

export const SCREEN_KINDS = ["screen", "modal", "state", "external"] as const;
export const ScreenKind = z.enum(SCREEN_KINDS);
export type ScreenKind = z.infer<typeof ScreenKind>;

export const Platform = z.enum(["mobile", "desktop"]);
export type Platform = z.infer<typeof Platform>;

export const Id = z.string().min(1);

export const Annotation = z.object({
  id: Id,
  type: AnnotationType,
  text: z.string(),
  /** Pin the note to one element of the screen; omit for a screen-level note. */
  targetElementId: z.string().optional(),
});
export type Annotation = z.infer<typeof Annotation>;

/**
 * Free-form but typed props. Known keys:
 * - placeholder (inputs, search, select), text (body copy for text/banner/toast/card)
 * - items: string[] (list, tabs, nav-bar, select, radio)
 * - checked: boolean (checkbox, toggle), value: number 0-100 (progress)
 * - row: string — consecutive elements sharing the same row id render side by side
 */
export const PropValue = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]);
export type PropValue = z.infer<typeof PropValue>;
export const ElementProps = z.record(z.string(), PropValue);
export type ElementProps = z.infer<typeof ElementProps>;

export const Element = z.object({
  id: Id,
  type: ElementType,
  label: z.string(),
  props: ElementProps.default({}),
  /** The transition this element fires. Mirrors Transition.triggerElementId. */
  linkTo: z.string().optional(),
});
export type Element = z.infer<typeof Element>;

export const Position = z.object({ x: z.number(), y: z.number() });
export type Position = z.infer<typeof Position>;

export const Screen = z.object({
  id: Id,
  title: z.string(),
  purpose: z.string().default(""),
  kind: ScreenKind.default("screen"),
  elements: z.array(Element).default([]),
  annotations: z.array(Annotation).default([]),
  /** Flow-view position only; the storyboard ignores it. */
  position: Position.default({ x: 0, y: 0 }),
});
export type Screen = z.infer<typeof Screen>;

export const Transition = z.object({
  id: Id,
  from: Id,
  to: Id,
  trigger: z.string(),
  triggerElementId: z.string().optional(),
  kind: TransitionKind.default("happy"),
  condition: z.string().optional(),
  annotations: z.array(Annotation).default([]),
});
export type Transition = z.infer<typeof Transition>;

/** Reserved for a future audit pass. Not produced or rendered yet. */
export const Finding = z.object({
  id: Id,
  level: z.enum(["flow", "journey"]),
  targetId: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  evidenceLabel: z.string(),
  text: z.string(),
  suggestion: z.string(),
});
export type Finding = z.infer<typeof Finding>;

export const Flow = z.object({
  id: Id,
  title: z.string(),
  personaId: z.string(),
  goal: z.string(),
  platform: Platform.default("mobile"),
  screens: z.array(Screen),
  transitions: z.array(Transition),
  startScreenId: z.string(),
  notes: z.string().default(""),
  /** Names of ./context/*.md files used when this flow was generated. */
  contextFiles: z.array(z.string()).optional(),
  findings: z.array(Finding).optional(),
});
export type Flow = z.infer<typeof Flow>;

export const SkillLevel = z.enum(["novice", "intermediate", "expert"]);
export type SkillLevel = z.infer<typeof SkillLevel>;

export const Persona = z.object({
  id: Id,
  name: z.string(),
  role: z.string(),
  goals: z.array(z.string()).default([]),
  context: z.string().default(""),
  skillLevel: SkillLevel.default("intermediate"),
  constraints: z.array(z.string()).default([]),
  painPoints: z.array(z.string()).default([]),
});
export type Persona = z.infer<typeof Persona>;

export const Project = z.object({
  id: Id,
  name: z.string(),
  personas: z.array(Persona),
  flows: z.array(Flow),
});
export type Project = z.infer<typeof Project>;

export function parseProject(data: unknown): Project {
  return Project.parse(data);
}
