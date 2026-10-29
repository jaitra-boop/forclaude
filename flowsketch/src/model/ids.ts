import { customAlphabet } from "nanoid";

const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

/** Short, readable, prefixed ids: scr_x1y2z3a4, el_…, tr_…, an_…, pe_…, fl_… */
export function newId(prefix: "scr" | "el" | "tr" | "an" | "pe" | "fl" | "pr" | "fi"): string {
  return `${prefix}_${nano()}`;
}
