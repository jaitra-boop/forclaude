import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";
import { anthropicClient } from "./llm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5";
const fallbacks = (process.env.ANTHROPIC_FALLBACKS ?? "default").trim() !== "off";
const port = Number(process.env.PORT ?? 8787);

const app = createApp({
  llm: apiKey ? anthropicClient({ apiKey, model, fallbacks }) : null,
  model,
  projectsDir: path.join(root, "projects"),
  contextDir: path.join(root, "context"),
});

app.listen(port, "127.0.0.1", () => {
  console.log(`[flowsketch] API on http://127.0.0.1:${port} — ${apiKey ? `model ${model}` : "MOCK MODE (no ANTHROPIC_API_KEY)"}`);
});
