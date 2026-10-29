/**
 * Seed personas and the hand-written "Invite a teammate" flow used in mock mode
 * (no API key) and as the starter project. Ids are fixed so tests can refer to them.
 */
import { autoLayout } from "./layout";
import type { Flow, Persona, Project } from "./schema";

export const SEED_PERSONAS: Persona[] = [
  {
    id: "pe_priya",
    name: "Priya Shah",
    role: "Team lead at a 14-person design agency",
    goals: ["Get new hires working in the tool on day one", "Keep seat costs predictable"],
    context: "Manages onboarding between client calls, usually on her phone. Owns the billing account.",
    skillLevel: "intermediate",
    constraints: ["Often on mobile with patchy wifi", "Has 5 minutes between meetings"],
    painPoints: [
      "Invites land in spam and new hires get stuck",
      "Surprise charges when someone adds a seat",
      "Can't tell who has accepted an invite",
    ],
  },
  {
    id: "pe_marcus",
    name: "Marcus Okafor",
    role: "New operations coordinator at a nonprofit",
    goals: ["Set up volunteers without asking IT", "Avoid making mistakes that affect others"],
    context: "First SaaS admin role. Works on a shared desktop at the office.",
    skillLevel: "novice",
    constraints: ["Unfamiliar with roles and permissions jargon", "Uses a screen magnifier at 150%"],
    painPoints: ["Settings pages full of unexplained options", "Unclear whether an action can be undone"],
  },
];

export const SAMPLE_FLOW: Flow = {
  id: "fl_invite",
  title: "Invite a teammate",
  personaId: "pe_priya",
  goal: "Invite a new hire to the workspace and know they got the invite",
  platform: "mobile",
  startScreenId: "scr_members",
  notes: "Sample flow (mock mode). Covers the happy path, an invalid-email error and the seat-limit branch.",
  screens: [
    {
      id: "scr_members",
      title: "Team members",
      purpose: "See who is in the workspace and start an invite",
      kind: "screen",
      position: { x: 0, y: 0 },
      elements: [
        { id: "el_m_header", type: "header", label: "Team", props: {} },
        { id: "el_m_search", type: "search", label: "Search members", props: { placeholder: "Search by name or email" } },
        { id: "el_m_list", type: "list", label: "Members", props: { items: ["Priya Shah · Owner", "Dana Lee · Member", "Sam Ortiz · Invited (pending)"] } },
        { id: "el_m_invite", type: "button-primary", label: "Invite teammate", props: {}, linkTo: "tr_open_invite" },
        { id: "el_m_nav", type: "nav-bar", label: "Navigation", props: { items: ["Home", "Projects", "Team", "Settings"] } },
      ],
      annotations: [
        { id: "an_m1", type: "rationale", text: "Pending invites stay in the list so Priya can see who hasn't accepted yet (pain point: can't tell who accepted).", targetElementId: "el_m_list" },
        { id: "an_m2", type: "open-question", text: "Should members (not just owners) be able to invite?" },
      ],
    },
    {
      id: "scr_invite",
      title: "Invite form",
      purpose: "Enter the new hire's email and choose a role",
      kind: "modal",
      position: { x: 280, y: 0 },
      elements: [
        { id: "el_i_header", type: "header", label: "Invite teammate", props: {} },
        { id: "el_i_email", type: "text-input", label: "Work email", props: { placeholder: "name@company.com" } },
        { id: "el_i_role", type: "radio", label: "Role", props: { items: ["Member — can edit projects", "Viewer — can only comment"] } },
        { id: "el_i_seat", type: "banner", label: "Seat cost", props: { text: "Adds 1 seat: $12/month, prorated" } },
        { id: "el_i_cancel", type: "button-secondary", label: "Cancel", props: { row: "actions" }, linkTo: "tr_cancel" },
        { id: "el_i_send", type: "button-primary", label: "Send invite", props: { row: "actions" }, linkTo: "tr_send" },
      ],
      annotations: [
        { id: "an_i1", type: "rationale", text: "Seat cost is shown before sending so there are no surprise charges (pain point).", targetElementId: "el_i_seat" },
        { id: "an_i2", type: "rationale", text: "Roles are described in plain words, not permission names.", targetElementId: "el_i_role" },
        { id: "an_i3", type: "tech-note", text: "Validate email format client-side; check existing membership server-side." },
      ],
    },
    {
      id: "scr_sending",
      title: "Sending…",
      purpose: "Loading state while the invite is created",
      kind: "state",
      position: { x: 560, y: 0 },
      elements: [
        { id: "el_s_header", type: "header", label: "Invite teammate", props: {} },
        { id: "el_s_progress", type: "progress", label: "Sending invite", props: { value: 60 } },
        { id: "el_s_text", type: "text", label: "Status", props: { text: "Sending to name@company.com…" } },
      ],
      annotations: [
        { id: "an_s1", type: "edge-case", text: "On a dropped connection, keep the form data and offer Retry instead of losing the email." },
      ],
    },
    {
      id: "scr_sent",
      title: "Invite sent",
      purpose: "Confirm the invite went out and set expectations",
      kind: "screen",
      position: { x: 840, y: 0 },
      elements: [
        { id: "el_c_header", type: "header", label: "Invite sent", props: {} },
        { id: "el_c_icon", type: "icon-placeholder", label: "Check", props: {} },
        { id: "el_c_text", type: "text", label: "Confirmation", props: { text: "We emailed name@company.com. The invite expires in 7 days." } },
        { id: "el_c_copy", type: "button-secondary", label: "Copy invite link", props: {} },
        { id: "el_c_done", type: "button-primary", label: "Done", props: {}, linkTo: "tr_done" },
      ],
      annotations: [
        { id: "an_c1", type: "rationale", text: "Copy link is a fallback when emails land in spam (pain point).", targetElementId: "el_c_copy" },
        { id: "an_c2", type: "evidence", text: "Support tickets: 'new hire never got the email' is the top onboarding complaint (assumed — verify)." },
      ],
    },
    {
      id: "scr_email_error",
      title: "Email error",
      purpose: "Explain why the invite could not be sent",
      kind: "state",
      position: { x: 560, y: 320 },
      elements: [
        { id: "el_e_header", type: "header", label: "Invite teammate", props: {} },
        { id: "el_e_email", type: "text-input", label: "Work email", props: { placeholder: "name@company" } },
        { id: "el_e_error", type: "form-error", label: "This doesn't look like a full email address.", props: {} },
        { id: "el_e_fix", type: "button-primary", label: "Try again", props: {}, linkTo: "tr_retry" },
      ],
      annotations: [
        { id: "an_e1", type: "edge-case", text: "Also covers: already a member, and the domain is blocked by workspace policy." },
      ],
    },
    {
      id: "scr_seats",
      title: "Seat limit reached",
      purpose: "Stop and explain when the plan has no free seats",
      kind: "modal",
      position: { x: 280, y: 320 },
      elements: [
        { id: "el_l_header", type: "heading", label: "No seats left", props: {} },
        { id: "el_l_text", type: "text", label: "Explanation", props: { text: "Your plan includes 14 seats and all are in use." } },
        { id: "el_l_upgrade", type: "button-primary", label: "Add a seat", props: {} },
        { id: "el_l_back", type: "button-secondary", label: "Not now", props: {}, linkTo: "tr_seats_back" },
      ],
      annotations: [
        { id: "an_l1", type: "open-question", text: "Can non-owners request a seat from the owner instead of seeing a dead end?" },
      ],
    },
  ],
  transitions: [
    { id: "tr_open_invite", from: "scr_members", to: "scr_invite", trigger: 'Tap "Invite teammate"', triggerElementId: "el_m_invite", kind: "happy", annotations: [] },
    { id: "tr_seat_limit", from: "scr_members", to: "scr_seats", trigger: 'Tap "Invite teammate"', kind: "alternate", condition: "No free seats on the plan", annotations: [] },
    { id: "tr_send", from: "scr_invite", to: "scr_sending", trigger: 'Tap "Send invite"', triggerElementId: "el_i_send", kind: "happy", annotations: [] },
    { id: "tr_cancel", from: "scr_invite", to: "scr_members", trigger: 'Tap "Cancel"', triggerElementId: "el_i_cancel", kind: "back", annotations: [] },
    { id: "tr_ok", from: "scr_sending", to: "scr_sent", trigger: "Invite created", kind: "happy", annotations: [] },
    {
      id: "tr_invalid", from: "scr_sending", to: "scr_email_error", trigger: "Server rejects email", kind: "error", condition: "Invalid or already a member",
      annotations: [{ id: "an_t1", type: "tech-note", text: "API returns 422 with a reason code; map each code to plain copy." }],
    },
    { id: "tr_retry", from: "scr_email_error", to: "scr_invite", trigger: 'Tap "Try again"', triggerElementId: "el_e_fix", kind: "back", annotations: [] },
    { id: "tr_done", from: "scr_sent", to: "scr_members", trigger: 'Tap "Done"', triggerElementId: "el_c_done", kind: "back", annotations: [] },
    { id: "tr_seats_back", from: "scr_seats", to: "scr_members", trigger: 'Tap "Not now"', triggerElementId: "el_l_back", kind: "back", annotations: [] },
  ],
};

// Lay the sample out like a generated flow would be.
const samplePositions = autoLayout(SAMPLE_FLOW);
for (const s of SAMPLE_FLOW.screens) s.position = samplePositions[s.id] ?? s.position;

export function sampleProject(): Project {
  return structuredClone({
    id: "pr_default",
    name: "default",
    personas: SEED_PERSONAS,
    flows: [SAMPLE_FLOW],
  });
}
