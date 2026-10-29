/** Loads ./context/*.md (personas, constraints, principles, tech limits) for generation prompts. */
import { promises as fs } from "node:fs";
import path from "node:path";

export interface ContextFile {
  name: string;
  content: string;
}

const MAX_TOTAL_CHARS = 200_000;

export async function loadContext(dir: string): Promise<ContextFile[]> {
  let names: string[];
  try {
    names = (await fs.readdir(dir)).filter((n) => n.toLowerCase().endsWith(".md")).sort();
  } catch {
    return [];
  }
  const files: ContextFile[] = [];
  let total = 0;
  for (const name of names) {
    if (name.toLowerCase() === "readme.md") continue;
    const content = (await fs.readFile(path.join(dir, name), "utf8")).trim();
    if (!content) continue;
    if (total + content.length > MAX_TOTAL_CHARS) {
      console.warn(`[context] skipping ${name}: context folder exceeds ${MAX_TOTAL_CHARS} characters`);
      continue;
    }
    total += content.length;
    files.push({ name, content });
  }
  return files;
}

export function contextBlock(files: ContextFile[]): string {
  if (files.length === 0) return "";
  return files.map((f) => `<context_file name="${f.name}">\n${f.content}\n</context_file>`).join("\n\n");
}
