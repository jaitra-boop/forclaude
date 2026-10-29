/**
 * The local API. Holds the Anthropic key (never sent to the browser) and
 * exposes generation, refinement, context and project persistence.
 */
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { GenerateRequest, RefineRequest, type GenerateResponse, type HealthResponse, type RefineResponse } from "../src/model/api";
import { RefinePatch, WireFlow, wireFlowProblems, wireToFlow } from "../src/model/aiSchema";
import { refinePatchProblems } from "../src/model/refine";
import { Project } from "../src/model/schema";
import { loadContext } from "./context";
import { generateStructured, LlmError, type LlmClient } from "./llm";
import { mockGenerate, mockRefine } from "./mock";
import { generateSystemPrompt, generateUserPrompt, refineSystemPrompt, refineUserPrompt } from "./prompts";
import { ProjectFileError, ProjectStore } from "./projects";

export interface AppDeps {
  /** null = mock mode */
  llm: LlmClient | null;
  model: string;
  projectsDir: string;
  contextDir: string;
}

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new BadRequest(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  return parsed.data;
}

class BadRequest extends Error {
  constructor(readonly details: string[]) {
    super("Invalid request");
  }
}

export function createApp(deps: AppDeps) {
  const app = express();
  const projects = new ProjectStore(deps.projectsDir);
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", asyncRoute(async (_req, res) => {
    const files = await loadContext(deps.contextDir);
    const body: HealthResponse = { ok: true, mock: deps.llm === null, model: deps.model, contextFiles: files.map((f) => f.name) };
    res.json(body);
  }));

  app.get("/api/context", asyncRoute(async (_req, res) => {
    const files = await loadContext(deps.contextDir);
    res.json({ files: files.map((f) => ({ name: f.name, chars: f.content.length })) });
  }));

  app.get("/api/projects", asyncRoute(async (_req, res) => {
    res.json({ projects: await projects.list() });
  }));

  app.get("/api/projects/:name", asyncRoute(async (req, res) => {
    const project = await projects.load(String(req.params.name));
    if (!project) {
      res.status(404).json({ error: `No project named ${req.params.name}` });
      return;
    }
    res.json(project);
  }));

  app.put("/api/projects/:name", asyncRoute(async (req, res) => {
    const parsed = Project.safeParse(req.body);
    if (!parsed.success) throw new BadRequest(parsed.error.issues.slice(0, 20).map((i) => `${i.path.join(".")}: ${i.message}`));
    await projects.save(String(req.params.name), parsed.data);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  }));

  app.post("/api/generate-flow", asyncRoute(async (req, res) => {
    const body = parseBody(GenerateRequest, req.body);
    const context = await loadContext(deps.contextDir);
    const contextFiles = context.map((f) => f.name);
    if (!deps.llm) {
      const flow = mockGenerate(body);
      if (contextFiles.length) flow.contextFiles = contextFiles;
      const out: GenerateResponse = { flow, contextFiles, mock: true, attempts: 0 };
      res.json(out);
      return;
    }
    const { value, attempts } = await generateStructured(deps.llm, {
      system: generateSystemPrompt(),
      user: generateUserPrompt(body, context),
      schema: WireFlow,
      check: wireFlowProblems,
    });
    const flow = wireToFlow(value, { personaId: body.persona?.id ?? "", platform: body.platform, contextFiles });
    const out: GenerateResponse = { flow, contextFiles, mock: false, attempts };
    res.json(out);
  }));

  app.post("/api/refine", asyncRoute(async (req, res) => {
    const body = parseBody(RefineRequest, req.body);
    if (body.action === "custom" && !body.instruction.trim()) throw new BadRequest(["instruction: write what you want changed"]);
    if (!deps.llm) {
      const patch = RefinePatch.parse(mockRefine(body));
      const out: RefineResponse = { patch, mock: true, attempts: 0 };
      res.json(out);
      return;
    }
    const context = await loadContext(deps.contextDir);
    const { value, attempts } = await generateStructured(deps.llm, {
      system: refineSystemPrompt(),
      user: refineUserPrompt(body, context),
      schema: RefinePatch,
      check: (p) => refinePatchProblems(body.flow, p),
    });
    const out: RefineResponse = { patch: value, mock: false, attempts };
    res.json(out);
  }));

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof BadRequest) {
      res.status(400).json({ error: err.message, details: err.details });
    } else if (err instanceof LlmError) {
      console.error(`[llm] ${err.message}`, err.details);
      res.status(err.status).json({ error: err.message, details: err.details });
    } else if (err instanceof ProjectFileError) {
      res.status(422).json({ error: err.message, details: [err.detail] });
    } else if (err instanceof SyntaxError) {
      res.status(400).json({ error: "Malformed JSON" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Server error", details: [String(err)] });
    }
  });

  return app;
}
