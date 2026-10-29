/** Markdown export: one section per screen with its elements, transitions and annotations. */
import type { Annotation, Element, Flow, Persona } from "../model/schema";

const ANN = { rationale: "Why", "edge-case": "Edge case", "open-question": "Open question", "tech-note": "Tech note", evidence: "Evidence" } as const;

function elementLine(e: Element): string {
  const p = e.props;
  const extra: string[] = [];
  if (typeof p.placeholder === "string") extra.push(`placeholder "${p.placeholder}"`);
  if (typeof p.text === "string") extra.push(`"${p.text}"`);
  if (Array.isArray(p.items)) extra.push(`items: ${p.items.join(", ")}`);
  if (typeof p.checked === "boolean") extra.push(p.checked ? "on" : "off");
  if (typeof p.value === "number") extra.push(`${p.value}%`);
  if (typeof p.row === "string") extra.push(`row ${p.row}`);
  const label = e.label ? ` “${e.label}”` : "";
  return `- **${e.type}**${label}${extra.length ? ` — ${extra.join("; ")}` : ""}`;
}

function annLines(list: Annotation[], elements: Element[] = []): string[] {
  return list.map((a, i) => {
    const target = a.targetElementId ? elements.find((e) => e.id === a.targetElementId) : undefined;
    return `${i + 1}. _${ANN[a.type]}_${target ? ` (on “${target.label || target.type}”)` : ""}: ${a.text}`;
  });
}

export function flowToMarkdown(flow: Flow, personas: Persona[] = []): string {
  const title = (id: string) => flow.screens.find((s) => s.id === id)?.title ?? id;
  const persona = personas.find((p) => p.id === flow.personaId);
  const out: string[] = [`# ${flow.title}`, ""];
  out.push(`- **Goal:** ${flow.goal}`);
  out.push(`- **Platform:** ${flow.platform}`);
  if (persona) out.push(`- **Persona:** ${persona.name} — ${persona.role}`);
  out.push(`- **Start screen:** ${title(flow.startScreenId)}`);
  if (flow.contextFiles?.length) out.push(`- **Context files:** ${flow.contextFiles.join(", ")}`);
  if (flow.notes) out.push("", flow.notes);
  for (const s of flow.screens) {
    out.push("", `## ${s.title}${s.kind !== "screen" ? ` (${s.kind})` : ""}`, "");
    if (s.purpose) out.push(`_${s.purpose}_`, "");
    out.push("### Elements", "");
    out.push(...(s.elements.length ? s.elements.map(elementLine) : ["- (empty)"]));
    const outgoing = flow.transitions.filter((t) => t.from === s.id);
    if (outgoing.length) {
      out.push("", "### Transitions", "");
      for (const t of outgoing) {
        const by = t.triggerElementId ? s.elements.find((e) => e.id === t.triggerElementId) : undefined;
        out.push(`- ${t.trigger} → **${title(t.to)}** [${t.kind}]${t.condition ? ` if ${t.condition}` : ""}${by ? ` (fired by “${by.label}”)` : ""}`);
        for (const line of annLines(t.annotations)) out.push(`  ${line}`);
      }
    }
    if (s.annotations.length) out.push("", "### Annotations", "", ...annLines(s.annotations, s.elements));
  }
  return out.join("\n") + "\n";
}
