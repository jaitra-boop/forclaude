// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/app";
import { generateStructured, LlmError, type LlmClient, type LlmRequest } from "../server/llm";
import { loadContext } from "../server/context";
import { generateUserPrompt } from "../server/prompts";
import { WireFlow, flowToWire } from "../src/model/aiSchema";
import { checkIntegrity } from "../src/model/integrity";
import { SAMPLE_FLOW, SEED_PERSONAS, sampleProject } from "../src/model/sample";
import { Flow } from "../src/model/schema";

let dir: string;
let projectsDir: string;
let contextDir: string;

beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "flowsketch-"));
  projectsDir = path.join(dir, "projects");
  contextDir = path.join(dir, "context");
  await fs.mkdir(contextDir);
  await fs.writeFile(path.join(contextDir, "principles.md"), "# Principles\n- One primary action per screen");
  await fs.writeFile(path.join(contextDir, "README.md"), "ignored");
  await fs.writeFile(path.join(contextDir, "notes.txt"), "ignored");
});
afterAll(() => fs.rm(dir, { recursive: true, force: true }));

/** A fake model that returns queued responses and records what it was sent. */
function fakeLlm(responses: (string | Error)[]): LlmClient & { calls: LlmRequest[] } {
  const calls: LlmRequest[] = [];
  return {
    calls,
    async complete(req) {
      calls.push(structuredClone(req));
      const next = responses.shift();
      if (next === undefined) throw new Error("no more responses");
      if (next instanceof Error) throw next;
      return next;
    },
  };
}

const persona = SEED_PERSONAS[0]!;
const validWire = JSON.stringify(flowToWire(SAMPLE_FLOW));
const generateBody = { persona, task: "Invite a teammate", platform: "mobile", extraContext: "", scope: "full" };

describe("context loader", () => {
  it("loads only top-level markdown files except README", async () => {
    const files = await loadContext(contextDir);
    expect(files.map((f) => f.name)).toEqual(["principles.md"]);
    expect(await loadContext(path.join(dir, "missing"))).toEqual([]);
  });

  it("puts context, persona and scope into the prompt", async () => {
    const prompt = generateUserPrompt({ persona, task: "X", platform: "desktop", extraContext: "Must work offline", scope: "happy" }, await loadContext(contextDir));
    expect(prompt).toContain('<context_file name="principles.md">');
    expect(prompt).toContain(persona.painPoints[0]);
    expect(prompt).toContain("happy path only");
    expect(prompt).toContain("Must work offline");
  });
});

describe("generateStructured", () => {
  it("returns the first valid response", async () => {
    const llm = fakeLlm([validWire]);
    const res = await generateStructured(llm, { system: "s", user: "u", schema: WireFlow });
    expect(res.attempts).toBe(1);
    expect(llm.calls[0]!.schema).toHaveProperty("type", "object");
  });

  it("retries once with the validation error, then succeeds", async () => {
    const bad = JSON.parse(validWire);
    delete bad.screens[0].elements[0].type;
    const llm = fakeLlm([JSON.stringify(bad), validWire]);
    const res = await generateStructured(llm, { system: "s", user: "u", schema: WireFlow });
    expect(res.attempts).toBe(2);
    const retry = llm.calls[1]!.messages;
    expect(retry).toHaveLength(3);
    expect(retry[1]!.role).toBe("assistant");
    expect(retry[2]!.content).toMatch(/failed validation[\s\S]*screens\.0\.elements\.0\.type/);
  });

  it("feeds semantic check failures back too", async () => {
    const bad = JSON.parse(validWire);
    bad.startScreenId = "nope";
    const llm = fakeLlm([JSON.stringify(bad), validWire]);
    const { wireFlowProblems } = await import("../src/model/aiSchema");
    const res = await generateStructured(llm, { system: "s", user: "u", schema: WireFlow, check: wireFlowProblems });
    expect(res.attempts).toBe(2);
    expect(llm.calls[1]!.messages[2]!.content).toContain("startScreenId");
  });

  it("gives up after one retry with the last problems", async () => {
    const llm = fakeLlm(["not json", "{}"]);
    await expect(generateStructured(llm, { system: "s", user: "u", schema: WireFlow })).rejects.toMatchObject({
      message: expect.stringContaining("even after a retry"),
      details: expect.arrayContaining([expect.stringContaining("title")]),
    });
    expect(llm.calls).toHaveLength(2);
  });
});

describe("API", () => {
  it("health reports mock mode and context files", async () => {
    const app = createApp({ llm: null, model: "m", projectsDir, contextDir });
    const res = await request(app).get("/api/health");
    expect(res.body).toEqual({ ok: true, mock: true, model: "m", contextFiles: ["principles.md"] });
  });

  it("mock mode returns the sample flow with valid references", async () => {
    const app = createApp({ llm: null, model: "m", projectsDir, contextDir });
    const res = await request(app).post("/api/generate-flow").send(generateBody);
    expect(res.status).toBe(200);
    const flow = Flow.parse(res.body.flow);
    expect(flow.title).toBe("Invite a teammate");
    expect(flow.screens.length).toBeGreaterThanOrEqual(5);
    expect(checkIntegrity(flow)).toEqual([]);
    expect(res.body.contextFiles).toEqual(["principles.md"]);
    const happy = await request(app).post("/api/generate-flow").send({ ...generateBody, scope: "happy" });
    expect(happy.body.flow.screens).toHaveLength(4);
  });

  it("generates through the model, validates and lays out", async () => {
    const llm = fakeLlm([validWire]);
    const app = createApp({ llm, model: "m", projectsDir, contextDir });
    const res = await request(app).post("/api/generate-flow").send(generateBody);
    expect(res.status).toBe(200);
    const flow = Flow.parse(res.body.flow);
    expect(checkIntegrity(flow)).toEqual([]);
    expect(flow.personaId).toBe(persona.id);
    expect(flow.contextFiles).toEqual(["principles.md"]);
    expect(llm.calls[0]!.system).toContain("senior UX designer");
    expect(llm.calls[0]!.messages[0]!.content).toContain("principles.md");
  });

  it("returns a clear error on API failure", async () => {
    const llm = fakeLlm([new LlmError("Rate limited by the Anthropic API.", [], 429)]);
    const app = createApp({ llm, model: "m", projectsDir, contextDir });
    const res = await request(app).post("/api/generate-flow").send(generateBody);
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/Rate limited/);
  });

  it("returns 502 with details when output stays invalid", async () => {
    const app = createApp({ llm: fakeLlm(["{}", "{}"]), model: "m", projectsDir, contextDir });
    const res = await request(app).post("/api/generate-flow").send(generateBody);
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/unchanged/);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("rejects bad requests", async () => {
    const app = createApp({ llm: null, model: "m", projectsDir, contextDir });
    const res = await request(app).post("/api/generate-flow").send({ ...generateBody, task: "", platform: "watch" });
    expect(res.status).toBe(400);
    expect(res.body.details.join()).toMatch(/task|platform/);
  });

  it("refine (mock) returns a patch for each action", async () => {
    const app = createApp({ llm: null, model: "m", projectsDir, contextDir });
    for (const action of ["add-error-states", "simplify", "suggest-missing", "rewrite-annotations"]) {
      const res = await request(app).post("/api/refine").send({ flow: SAMPLE_FLOW, persona, action, screenId: "scr_invite" });
      expect(res.status, action).toBe(200);
      expect(res.body.patch.summary).toMatch(/mock/);
    }
    const custom = await request(app).post("/api/refine").send({ flow: SAMPLE_FLOW, persona, action: "custom", instruction: "" });
    expect(custom.status).toBe(400);
  });

  it("refine through the model retries when the patch references unknown ids", async () => {
    const badPatch = { summary: "x", addScreens: [], updateScreens: [], removeScreenIds: ["ghost"], addTransitions: [], updateTransitions: [], removeTransitionIds: [] };
    const goodPatch = { ...badPatch, removeScreenIds: ["scr_seats"] };
    const llm = fakeLlm([JSON.stringify(badPatch), JSON.stringify(goodPatch)]);
    const app = createApp({ llm, model: "m", projectsDir, contextDir });
    const res = await request(app).post("/api/refine").send({ flow: SAMPLE_FLOW, persona, action: "simplify" });
    expect(res.status).toBe(200);
    expect(res.body.attempts).toBe(2);
    expect(llm.calls[1]!.messages[2]!.content).toContain("ghost");
    expect(llm.calls[0]!.messages[0]!.content).toContain("scr_seats"); // current flow ids are shown to the model
  });

  it("persists projects as validated JSON files", async () => {
    const app = createApp({ llm: null, model: "m", projectsDir, contextDir });
    const seeded = await request(app).get("/api/projects/default");
    expect(seeded.status).toBe(200);
    expect(seeded.body.flows[0].title).toBe("Invite a teammate");
    const project = { ...sampleProject(), name: "demo" };
    project.flows[0]!.title = "Edited";
    expect((await request(app).put("/api/projects/demo").send(project)).status).toBe(200);
    const onDisk = JSON.parse(await fs.readFile(path.join(projectsDir, "demo.flow.json"), "utf8"));
    expect(onDisk.flows[0].title).toBe("Edited");
    expect((await request(app).get("/api/projects")).body.projects).toEqual(["default", "demo"]);
    // Invalid models are refused and the file is untouched.
    const bad = await request(app).put("/api/projects/demo").send({ ...project, flows: [{ title: 1 }] });
    expect(bad.status).toBe(400);
    expect(JSON.parse(await fs.readFile(path.join(projectsDir, "demo.flow.json"), "utf8")).flows[0].title).toBe("Edited");
    expect((await request(app).get("/api/projects/nope")).status).toBe(404);
    // Corrupt files on disk are reported, not silently replaced.
    await fs.writeFile(path.join(projectsDir, "broken.flow.json"), JSON.stringify({ id: "x" }));
    expect((await request(app).get("/api/projects/broken")).status).toBe(422);
  });

  it("rejects path traversal in project names", async () => {
    const app = createApp({ llm: null, model: "m", projectsDir, contextDir });
    const res = await request(app).get("/api/projects/..%2F..%2Fetc");
    expect(res.status).toBe(400);
  });
});
