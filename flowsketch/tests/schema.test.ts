import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Project, Flow } from "../src/model/schema";
import { WireFlow, RefinePatch, wireToFlow, wireFlowProblems, flowToWire } from "../src/model/aiSchema";
import { checkIntegrity } from "../src/model/integrity";
import { sampleProject, SAMPLE_FLOW } from "../src/model/sample";

const goodWire: WireFlow = {
  title: "Reset password",
  goal: "Get back into the account",
  notes: "Assumes email-based reset",
  startScreenId: "s1",
  screens: [
    {
      id: "s1", title: "Sign in", purpose: "Entry", kind: "screen",
      elements: [
        { id: "e1", type: "text-input", label: "Email", detail: "you@example.com", items: null, row: null },
        { id: "e2", type: "button-secondary", label: "Forgot password?", detail: null, items: null, row: null },
      ],
      annotations: [{ type: "rationale", text: "Link sits next to the field users get stuck on", targetElementId: "e2" }],
    },
    {
      id: "s2", title: "Check your email", purpose: "Confirmation", kind: "state",
      elements: [{ id: "e3", type: "progress", label: "Sending", detail: "70", items: null, row: null }],
      annotations: [],
    },
  ],
  transitions: [
    { id: "t1", from: "s1", to: "s2", trigger: 'Tap "Forgot password?"', triggerElementId: "e2", kind: "happy", condition: null, annotations: [] },
  ],
};

describe("project schema", () => {
  it("accepts the sample project", () => {
    expect(() => Project.parse(sampleProject())).not.toThrow();
  });

  it("fills defaults for optional fields", () => {
    const f = Flow.parse({ id: "f", title: "t", personaId: "", goal: "g", screens: [{ id: "s", title: "S" }], transitions: [], startScreenId: "s" });
    expect(f.platform).toBe("mobile");
    expect(f.screens[0]!.elements).toEqual([]);
    expect(f.screens[0]!.position).toEqual({ x: 0, y: 0 });
  });

  it("rejects unknown element types", () => {
    const bad = structuredClone(SAMPLE_FLOW) as unknown as { screens: { elements: { type: string }[] }[] };
    bad.screens[0]!.elements[0]!.type = "carousel";
    expect(Flow.safeParse(bad).success).toBe(false);
  });

  it("keeps findings optional (audit hook)", () => {
    const f = Flow.parse({ ...SAMPLE_FLOW, findings: [{ id: "fi1", level: "flow", targetId: "scr_invite", severity: "high", evidenceLabel: "H1", text: "x", suggestion: "y" }] });
    expect(f.findings).toHaveLength(1);
  });
});

describe("AI output validation", () => {
  it("accepts a well-formed wire flow and converts it with valid references", () => {
    const parsed = WireFlow.parse(goodWire);
    expect(wireFlowProblems(parsed)).toEqual([]);
    const flow = wireToFlow(parsed, { personaId: "pe_priya", platform: "mobile", contextFiles: ["principles.md"] });
    expect(Flow.safeParse(flow).success).toBe(true);
    expect(checkIntegrity(flow)).toEqual([]);
    expect(flow.screens).toHaveLength(2);
    const t = flow.transitions[0]!;
    const btn = flow.screens[0]!.elements[1]!;
    expect(t.triggerElementId).toBe(btn.id);
    expect(btn.linkTo).toBe(t.id);
    expect(flow.screens[0]!.elements[0]!.props.placeholder).toBe("you@example.com");
    expect(flow.screens[1]!.elements[0]!.props.value).toBe(70);
    expect(flow.screens[0]!.annotations[0]!.targetElementId).toBe(btn.id);
    expect(flow.contextFiles).toEqual(["principles.md"]);
    // auto-layout places the second screen to the right
    expect(flow.screens[1]!.position.x).toBeGreaterThan(flow.screens[0]!.position.x);
  });

  it("rejects output with missing required fields or bad enums", () => {
    const missing = structuredClone(goodWire) as Partial<WireFlow>;
    delete missing.transitions;
    expect(WireFlow.safeParse(missing).success).toBe(false);
    const badKind = structuredClone(goodWire);
    (badKind.transitions[0] as { kind: string }).kind = "sideways";
    const res = WireFlow.safeParse(badKind);
    expect(res.success).toBe(false);
    if (!res.success) expect(z.prettifyError(res.error)).toMatch(/kind/);
  });

  it("reports structural problems that the schema can't catch", () => {
    const w = structuredClone(goodWire);
    w.startScreenId = "nope";
    w.transitions[0]!.to = "ghost";
    const problems = wireFlowProblems(w);
    expect(problems.join("\n")).toMatch(/startScreenId/);
    expect(problems.join("\n")).toMatch(/ghost/);
  });

  it("drops transitions to unknown screens when converting", () => {
    const w = structuredClone(goodWire);
    w.transitions.push({ ...w.transitions[0]!, id: "t2", to: "ghost", triggerElementId: null });
    const flow = wireToFlow(w, { personaId: "", platform: "desktop" });
    expect(flow.transitions).toHaveLength(1);
    expect(checkIntegrity(flow)).toEqual([]);
  });

  it("round-trips the sample flow through the wire format", () => {
    const wire = flowToWire(SAMPLE_FLOW);
    expect(WireFlow.safeParse(wire).success).toBe(true);
    const back = wireToFlow(wire, { personaId: SAMPLE_FLOW.personaId, platform: "mobile" });
    expect(back.screens.map((s) => s.title)).toEqual(SAMPLE_FLOW.screens.map((s) => s.title));
    expect(back.transitions).toHaveLength(SAMPLE_FLOW.transitions.length);
    expect(checkIntegrity(back)).toEqual([]);
  });

  it("validates refine patches", () => {
    const empty = { summary: "", addScreens: [], updateScreens: [], removeScreenIds: [], addTransitions: [], updateTransitions: [], removeTransitionIds: [] };
    expect(RefinePatch.safeParse(empty).success).toBe(true);
    expect(RefinePatch.safeParse({ ...empty, removeScreenIds: [3] }).success).toBe(false);
  });
});
