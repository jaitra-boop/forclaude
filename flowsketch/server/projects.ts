/** Projects persist as ./projects/<name>.flow.json, validated with the same Zod schema as the app. */
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { Project } from "../src/model/schema";
import { sampleProject } from "../src/model/sample";

export const PROJECT_NAME = /^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,63}$/;

export class ProjectStore {
  constructor(private dir: string) {}

  private file(name: string): string {
    if (!PROJECT_NAME.test(name)) throw new Error("Invalid project name");
    return path.join(this.dir, `${name}.flow.json`);
  }

  async list(): Promise<string[]> {
    try {
      return (await fs.readdir(this.dir)).filter((f) => f.endsWith(".flow.json")).map((f) => f.slice(0, -".flow.json".length)).sort();
    } catch {
      return [];
    }
  }

  /** Loads a project; the "default" project is created from the seed sample on first run. */
  async load(name: string): Promise<Project | null> {
    let raw: string;
    try {
      raw = await fs.readFile(this.file(name), "utf8");
    } catch {
      if (name !== "default") return null;
      const seeded = { ...sampleProject(), name };
      await this.save(name, seeded);
      return seeded;
    }
    const parsed = Project.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new ProjectFileError(name, z.prettifyError(parsed.error));
    return parsed.data;
  }

  /** Validates, then writes atomically (temp file + rename) so a crash never leaves half a file. */
  async save(name: string, data: unknown): Promise<Project> {
    const project = Project.parse(data);
    await fs.mkdir(this.dir, { recursive: true });
    const target = this.file(name);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(project, null, 2) + "\n", "utf8");
    await fs.rename(tmp, target);
    return project;
  }
}

export class ProjectFileError extends Error {
  constructor(readonly project: string, readonly detail: string) {
    super(`Project file ${project}.flow.json does not match the schema`);
  }
}
