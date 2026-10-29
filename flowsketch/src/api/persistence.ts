/** Loads the project on start and autosaves it (debounced) whenever the model changes. */
import { useEffect } from "react";
import { actions, useStore } from "../store/store";
import { sampleProject } from "../model/sample";
import { api, ApiRequestError } from "./client";
import { useStatus } from "./status";

const AUTOSAVE_MS = 800;

export function useProjectPersistence(): void {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let loaded = false;
    const name = new URLSearchParams(window.location.search).get("project") ?? "default";
    useStatus.setState({ projectName: name });

    (async () => {
      try {
        const health = await api.health();
        useStatus.setState({ connected: true, mock: health.mock, model: health.model, contextFiles: health.contextFiles });
        const project = await api.loadProject(name);
        if (!cancelled) actions.load(project);
        useStatus.setState({ save: "saved" });
      } catch (e) {
        // Server down: keep working in memory with the sample so the UI is still usable.
        if (!cancelled) actions.load(sampleProject());
        useStatus.setState({ connected: false, save: "offline", saveError: e instanceof Error ? e.message : String(e) });
      } finally {
        loaded = true;
      }
    })();

    const unsub = useStore.subscribe((s, prev) => {
      if (!loaded || s.revision === prev.revision || !useStatus.getState().connected) return;
      clearTimeout(timer);
      useStatus.setState({ save: "saving" });
      timer = setTimeout(async () => {
        try {
          const res = await api.saveProject(name, useStore.getState().project);
          useStatus.setState({ save: "saved", savedAt: res.savedAt, saveError: undefined });
        } catch (e) {
          const msg = e instanceof ApiRequestError ? [e.message, ...e.details].join(" — ") : String(e);
          useStatus.setState({ save: "error", saveError: msg });
        }
      }, AUTOSAVE_MS);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsub();
    };
  }, []);
}
