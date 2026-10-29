import { describe, expect, it } from "vitest";
import { computePath, enumeratePaths, offPathScreens } from "../src/model/paths";
import { SAMPLE_FLOW } from "../src/model/sample";
import type { Flow } from "../src/model/schema";

const titles = (f: Flow, choices = {}) => computePath(f, choices).map((s) => s.screen.id);

function graph(edges: [string, string, Flow["transitions"][number]["kind"]?][], start = "a"): Flow {
  const ids = [...new Set(edges.flatMap(([a, b]) => [a, b]))];
  return {
    id: "f", title: "g", personaId: "", goal: "", platform: "mobile", notes: "", startScreenId: start,
    screens: ids.map((id) => ({ id, title: id.toUpperCase(), purpose: "", kind: "screen", elements: [], annotations: [], position: { x: 0, y: 0 } })),
    transitions: edges.map(([from, to, kind], i) => ({ id: `t${i}`, from, to, trigger: `${from}->${to}`, kind: kind ?? "happy", annotations: [] })),
  };
}

describe("storyboard path", () => {
  it("follows the happy path from the start screen", () => {
    expect(titles(SAMPLE_FLOW)).toEqual(["scr_members", "scr_invite", "scr_sending", "scr_sent"]);
    const steps = computePath(SAMPLE_FLOW);
    // Ends by looping back to the members list via "Done".
    expect(steps.at(-1)!.loopsBackTo?.id).toBe("scr_members");
  });

  it("exposes branch alternatives", () => {
    const steps = computePath(SAMPLE_FLOW);
    expect(steps[0]!.alternatives.map((t) => t.id)).toEqual(["tr_seat_limit"]);
    expect(steps[2]!.alternatives.map((t) => t.id)).toEqual(["tr_invalid"]);
  });

  it("honours branch choices", () => {
    expect(titles(SAMPLE_FLOW, { scr_sending: "tr_invalid" })).toEqual(["scr_members", "scr_invite", "scr_sending", "scr_email_error"]);
    expect(titles(SAMPLE_FLOW, { scr_members: "tr_seat_limit" })).toEqual(["scr_members", "scr_seats"]);
  });

  it("ignores stale choices", () => {
    expect(titles(SAMPLE_FLOW, { scr_members: "tr_deleted" })[1]).toBe("scr_invite");
  });

  it("terminates on cycles, including self-loops", () => {
    const loop = graph([["a", "b"], ["b", "c"], ["c", "a"]]);
    expect(titles(loop)).toEqual(["a", "b", "c"]);
    const self = graph([["a", "a"]]);
    expect(titles(self)).toEqual(["a"]);
    expect(computePath(self)[0]!.loopsBackTo?.id).toBe("a");
  });

  it("prefers forward edges over back edges", () => {
    const g = graph([["a", "b", "back"], ["a", "c", "error"]]);
    expect(titles(g)).toEqual(["a", "c"]);
  });

  it("handles a missing start screen and empty flows", () => {
    const g = graph([["a", "b"]], "zzz");
    expect(titles(g)).toEqual(["a", "b"]);
    expect(computePath({ ...g, screens: [], transitions: [] })).toEqual([]);
  });

  it("enumerates named paths without hanging on dense cyclic graphs", () => {
    const nodes = "abcdefghij".split("");
    const edges: [string, string][] = [];
    for (const x of nodes) for (const y of nodes) if (x !== y) edges.push([x, y]);
    const g = graph(edges);
    const t0 = Date.now();
    const paths = enumeratePaths(g, 24);
    expect(paths.length).toBeLessThanOrEqual(24);
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it("names sample paths and lists off-path screens", () => {
    const paths = enumeratePaths(SAMPLE_FLOW);
    expect(paths[0]!.label).toBe("Happy path");
    expect(paths.map((p) => p.label)).toEqual(expect.arrayContaining(["Error: Email error", "Alternate: Seat limit reached"]));
    const off = offPathScreens(SAMPLE_FLOW, computePath(SAMPLE_FLOW));
    expect(off.map((s) => s.id).sort()).toEqual(["scr_email_error", "scr_seats"]);
  });
});
