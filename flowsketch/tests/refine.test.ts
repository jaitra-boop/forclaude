import { describe, expect, it } from "vitest";
import { produce } from "immer";
import { applyRefinePatch, describePatch, refinePatchProblems } from "../src/model/refine";
import { checkIntegrity } from "../src/model/integrity";
import { mockRefine } from "../server/mock";
import { sampleProject, SEED_PERSONAS, SAMPLE_FLOW } from "../src/model/sample";
import { flowToMarkdown } from "../src/export/markdown";
import { storyboardHtml } from "../src/export/storyboardHtml";
import { computePath } from "../src/model/paths";
import type { RefinePatch } from "../src/model/aiSchema";
import type { RefineAction } from "../src/model/api";

const persona = SEED_PERSONAS[0]!;
const patchFor = (action: RefineAction, screenId?: string) =>
  mockRefine({ flow: SAMPLE_FLOW, persona, action, instruction: "Allow bulk invites", screenId });

describe("refine patches", () => {
  it.each(["add-error-states", "simplify", "suggest-missing", "rewrite-annotations", "custom"] as RefineAction[])(
    "%s applies cleanly and keeps references intact",
    (action) => {
      const patch = patchFor(action, "scr_invite");
      expect(refinePatchProblems(SAMPLE_FLOW, patch)).toEqual([]);
      const p = produce(sampleProject(), (d) => applyRefinePatch(d, "fl_invite", patch));
      expect(checkIntegrity(p.flows[0]!)).toEqual([]);
    },
  );

  it("adds error/empty states wired into the flow", () => {
    const patch = patchFor("add-error-states", "scr_invite");
    const p = produce(sampleProject(), (d) => applyRefinePatch(d, "fl_invite", patch));
    const f = p.flows[0]!;
    expect(f.screens).toHaveLength(8);
    const err = f.screens.find((s) => s.title.includes("couldn't load"))!;
    const retry = f.transitions.find((t) => t.from === err.id && t.to === "scr_invite")!;
    expect(retry.kind).toBe("back");
    expect(err.elements.find((e) => e.id === retry.triggerElementId)!.linkTo).toBe(retry.id);
    const d = describePatch(SAMPLE_FLOW, patch);
    expect(d.added).toHaveLength(5);
  });

  it("simplify removes the loading state and bridges the path", () => {
    const patch = patchFor("simplify");
    const p = produce(sampleProject(), (d) => applyRefinePatch(d, "fl_invite", patch));
    const f = p.flows[0]!;
    expect(f.screens.some((s) => s.id === "scr_sending")).toBe(false);
    expect(computePath(f).map((s) => s.screen.id)).toEqual(["scr_members", "scr_invite", "scr_sent"]);
    // The "Send invite" button now fires the bridge transition.
    const send = f.screens.find((s) => s.id === "scr_invite")!.elements.find((e) => e.id === "el_i_send")!;
    expect(f.transitions.find((t) => t.id === send.linkTo)!.to).toBe("scr_sent");
    // The error branch was re-attached instead of lost.
    expect(f.transitions.some((t) => t.from === "scr_invite" && t.to === "scr_email_error")).toBe(true);
    expect(describePatch(SAMPLE_FLOW, patch).removed[0]).toMatch(/Sending…" and its 3 transitions/);
  });

  it("updateScreens keeps element ids (and links) for kept elements", () => {
    const patch = patchFor("suggest-missing", "scr_invite");
    const p = produce(sampleProject(), (d) => applyRefinePatch(d, "fl_invite", patch));
    const invite = p.flows[0]!.screens.find((s) => s.id === "scr_invite")!;
    expect(invite.elements.find((e) => e.id === "el_i_send")!.linkTo).toBe("tr_send");
    expect(invite.elements.at(-1)!.label).toBe("Need help?");
    expect(invite.elements.at(-1)!.linkTo).toBeDefined();
  });

  it("skips references that don't exist instead of leaving them dangling", () => {
    const patch: RefinePatch = {
      summary: "bad", addScreens: [], updateScreens: [{ id: "ghost", title: "x", purpose: null, kind: null, elements: null, annotations: null }],
      removeScreenIds: ["ghost2"], addTransitions: [{ id: "t", from: "scr_members", to: "nowhere", trigger: "x", triggerElementId: null, kind: "happy", condition: null, annotations: [] }],
      updateTransitions: [{ id: "tr_send", trigger: null, kind: null, condition: null, to: "nowhere", annotations: null }], removeTransitionIds: ["nope"],
    };
    expect(refinePatchProblems(SAMPLE_FLOW, patch)).toHaveLength(5);
    const p = produce(sampleProject(), (d) => applyRefinePatch(d, "fl_invite", patch));
    expect(p.flows[0]).toEqual(sampleProject().flows[0]);
  });
});

describe("exports", () => {
  it("markdown has one section per screen with elements, transitions and annotations", () => {
    const md = flowToMarkdown(SAMPLE_FLOW, SEED_PERSONAS);
    expect(md.match(/^## /gm)).toHaveLength(SAMPLE_FLOW.screens.length);
    expect(md).toContain("**Persona:** Priya Shah");
    expect(md).toContain('- **button-primary** “Send invite”');
    expect(md).toContain('- Tap "Send invite" → **Sending…** [happy] (fired by “Send invite”)');
    expect(md).toContain("_Why_ (on “Seat cost”): Seat cost is shown before sending");
  });

  it("printable storyboard renders frames and notes with the shared wireframe CSS", () => {
    const html = storyboardHtml(SAMPLE_FLOW, computePath(SAMPLE_FLOW));
    expect(html).toContain("wf-root");
    expect(html).toContain("1. Team members");
    expect(html).toContain("Pending invites stay in the list");
    // Grayscale only: every hex color used is a gray (r = g = b).
    const colors = [...html.matchAll(/#([0-9a-f]{6})\b/gi)].map((m) => m[1]!.toLowerCase());
    expect(colors.length).toBeGreaterThan(0);
    for (const c of colors) expect(c.slice(0, 2) === c.slice(2, 4) && c.slice(2, 4) === c.slice(4, 6), `#${c} is not gray`).toBe(true);
  });
});
