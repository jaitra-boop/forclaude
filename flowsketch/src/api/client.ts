/** Thin fetch wrappers for the local server. The browser never sees the API key. */
import type { ApiError, GenerateRequest, GenerateResponse, HealthResponse, RefineRequest, RefineResponse } from "../model/api";
import { Flow, Project } from "../model/schema";
import { RefinePatch } from "../model/aiSchema";

export class ApiRequestError extends Error {
  constructor(message: string, readonly details: string[] = [], readonly status = 0) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError("Can't reach the FlowSketch server. Is `npm run dev` running?");
  }
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiRequestError(`Server returned a non-JSON response (${res.status}).`, [], res.status);
  }
  if (!res.ok) {
    const err = data as Partial<ApiError>;
    throw new ApiRequestError(err.error ?? `Request failed (${res.status})`, err.details ?? [], res.status);
  }
  return data as T;
}

export const api = {
  health: () => request<HealthResponse>("GET", "/api/health"),
  loadProject: async (name: string) => Project.parse(await request<unknown>("GET", `/api/projects/${encodeURIComponent(name)}`)),
  saveProject: (name: string, project: Project) => request<{ ok: true; savedAt: string }>("PUT", `/api/projects/${encodeURIComponent(name)}`, project),
  async generateFlow(req: GenerateRequest): Promise<GenerateResponse> {
    const res = await request<GenerateResponse>("POST", "/api/generate-flow", req);
    // Re-validate on the client too: never put an unvalidated flow in the store.
    return { ...res, flow: Flow.parse(res.flow) };
  },
  async refine(req: RefineRequest): Promise<RefineResponse> {
    const res = await request<RefineResponse>("POST", "/api/refine", req);
    return { ...res, patch: RefinePatch.parse(res.patch) };
  },
};
