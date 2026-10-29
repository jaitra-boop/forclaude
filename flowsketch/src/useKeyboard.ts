import { useEffect } from "react";
import { actions, useStore } from "./store/store";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Delete / Cmd-Ctrl+D / Esc / Cmd-Ctrl+Z / Shift+Cmd-Ctrl+Z, ignored while typing in a field. */
export function useKeyboard(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "Escape") {
        if (isTyping(e.target)) (e.target as HTMLElement).blur();
        if (useStore.getState().editorScreenId) actions.openEditor(null);
        else actions.select(null);
        return;
      }
      if (isTyping(e.target)) return;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) actions.redo();
        else actions.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        actions.redo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        actions.duplicateSelection();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        actions.deleteSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
