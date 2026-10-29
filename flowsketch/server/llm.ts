/**
 * Structured generation against Claude. Responses are constrained with a JSON
 * schema derived from the Zod schema (structured outputs), parsed, validated
 * with Zod plus semantic checks, and retried once with the validation errors.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export interface LlmTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LlmRequest {
  system: string;
  messages: LlmTurn[];
  /** JSON schema the response must follow. */
  schema: Record<string, unknown>;
}

/** The only thing the server needs from a model; tests swap in a fake. */
export interface LlmClient {
  complete(req: LlmRequest): Promise<string>;
}

export class LlmError extends Error {
  constructor(message: string, readonly details: string[] = [], readonly status = 502) {
    super(message);
  }
}

export function anthropicClient(opts: { apiKey: string; model: string; fallbacks: boolean }): LlmClient {
  const client = new Anthropic({ apiKey: opts.apiKey });
  return {
    async complete({ system, messages, schema }) {
      const base = {
        model: opts.model,
        max_tokens: 32000,
        system,
        messages,
        output_config: { format: { type: "json_schema" as const, schema } },
      };
      let message: Anthropic.Message | Anthropic.Beta.BetaMessage;
      try {
        message = opts.fallbacks
          ? await client.beta.messages.stream({ ...base, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }).finalMessage()
          : await client.messages.stream(base).finalMessage();
      } catch (err) {
        throw toLlmError(err);
      }
      if (message.stop_reason === "refusal") throw new LlmError("The model declined this request. Try rephrasing the task.");
      if (message.stop_reason === "max_tokens") throw new LlmError("The response was too long and got cut off. Try a narrower task or the happy-path scope.");
      const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      if (!text.trim()) throw new LlmError("The model returned an empty response.");
      return text;
    },
  };
}

function toLlmError(err: unknown): LlmError {
  if (err instanceof Anthropic.AuthenticationError) return new LlmError("The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.", [], 401);
  if (err instanceof Anthropic.NotFoundError) return new LlmError("Model not found. Check ANTHROPIC_MODEL in .env.", [err.message], 400);
  if (err instanceof Anthropic.RateLimitError) return new LlmError("Rate limited by the Anthropic API. Wait a moment and try again.", [], 429);
  if (err instanceof Anthropic.BadRequestError) return new LlmError("The Anthropic API rejected the request.", [err.message], 400);
  if (err instanceof Anthropic.APIConnectionError) return new LlmError("Could not reach the Anthropic API. Check your network connection.", [], 503);
  if (err instanceof Anthropic.APIError) return new LlmError(`Anthropic API error${err.status ? ` (${err.status})` : ""}.`, [err.message]);
  return new LlmError("Unexpected error while calling the model.", [String(err)], 500);
}

/** JSON schema for a Zod schema, in the subset structured outputs accepts. */
export function jsonSchemaFor(schema: z.ZodType): Record<string, unknown> {
  return zodOutputFormat(schema).schema as Record<string, unknown>;
}

function issuesOf(text: string, schema: z.ZodType): { value?: unknown; problems: string[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { problems: [`Response is not valid JSON: ${(e as Error).message}`] };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { problems: parsed.error.issues.slice(0, 20).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
  }
  return { value: parsed.data, problems: [] };
}

/**
 * Ask for a structured response; validate; on failure retry once, showing the
 * model its previous output and the validation errors.
 */
export async function generateStructured<T>(
  llm: LlmClient,
  opts: { system: string; user: string; schema: z.ZodType<T>; check?: (value: T) => string[] },
): Promise<{ value: T; attempts: number }> {
  const schema = jsonSchemaFor(opts.schema);
  const messages: LlmTurn[] = [{ role: "user", content: opts.user }];
  let lastProblems: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await llm.complete({ system: opts.system, messages, schema });
    const { value, problems } = issuesOf(text, opts.schema);
    const all = value !== undefined && opts.check ? opts.check(value as T) : problems;
    if (value !== undefined && all.length === 0) return { value: value as T, attempts: attempt };
    lastProblems = value !== undefined ? all : problems;
    messages.push(
      { role: "assistant", content: text },
      {
        role: "user",
        content: `That response failed validation:\n${lastProblems.map((p) => `- ${p}`).join("\n")}\n\nReturn the complete corrected JSON. Fix only what is needed.`,
      },
    );
  }
  throw new LlmError("The model's response did not match the flow schema, even after a retry. Your existing flow is unchanged.", lastProblems, 502);
}
