/** App status that isn't part of the model: server mode, save state, errors. */
import { create } from "zustand";

export type SaveState = "idle" | "saving" | "saved" | "error" | "offline";

interface Status {
  connected: boolean;
  mock: boolean;
  model: string;
  contextFiles: string[];
  projectName: string;
  save: SaveState;
  saveError?: string;
  savedAt?: string;
}

export const useStatus = create<Status>()(() => ({
  connected: false,
  mock: true,
  model: "",
  contextFiles: [],
  projectName: "default",
  save: "idle",
}));
