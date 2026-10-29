/** Request/response shapes shared by the client and the local server. */
import { z } from "zod";
import { Flow, Persona, Platform } from "./schema";
import { RefinePatch } from "./aiSchema";

export const Scope = z.enum(["happy", "full"]);
export type Scope = z.infer<typeof Scope>;

export const GenerateRequest = z.object({
  persona: Persona.nullable(),
  task: z.string().min(1, "Describe the task or goal"),
  platform: Platform,
  extraContext: z.string().default(""),
  scope: Scope.default("full"),
});
export type GenerateRequest = z.infer<typeof GenerateRequest>;

export interface GenerateResponse {
  flow: Flow;
  contextFiles: string[];
  mock: boolean;
  attempts: number;
}

export const REFINE_ACTIONS = ["add-error-states", "simplify", "suggest-missing", "rewrite-annotations", "custom"] as const;
export const RefineAction = z.enum(REFINE_ACTIONS);
export type RefineAction = z.infer<typeof RefineAction>;

export const RefineRequest = z.object({
  flow: Flow,
  persona: Persona.nullable(),
  action: RefineAction,
  instruction: z.string().default(""),
  /** Focus the refinement on one screen; omit for the whole flow. */
  screenId: z.string().optional(),
});
export type RefineRequest = z.infer<typeof RefineRequest>;

export interface RefineResponse {
  patch: RefinePatch;
  mock: boolean;
  attempts: number;
}

export interface HealthResponse {
  ok: true;
  mock: boolean;
  model: string;
  contextFiles: string[];
}

export interface ApiError {
  error: string;
  details?: string[];
}
