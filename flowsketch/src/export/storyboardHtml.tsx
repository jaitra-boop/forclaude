/**
 * Printable storyboard (frames + annotations, grayscale). Uses the same
 * <WireframeScreen> as the app; the browser's print dialog saves it as PDF.
 */
import { renderToStaticMarkup } from "react-dom/server";
import wireframeCss from "../wireframe/wireframe.css?raw";
import { WireframeScreen, annotationNumbers } from "../wireframe/WireframeScreen";
import type { PathStep } from "../model/paths";
import type { Flow } from "../model/schema";
import { downloadText, slug } from "./download";

const LABEL = { rationale: "Why", "edge-case": "Edge case", "open-question": "Open question", "tech-note": "Tech note", evidence: "Evidence" } as const;

function PrintStoryboard({ flow, steps }: { flow: Flow; steps: PathStep[] }) {
  return (
    <div className="sb">
      <h1>{flow.title}</h1>
      <p className="meta">Goal: {flow.goal} · {flow.platform} · {steps.length} frames</p>
      {flow.notes && <p className="meta">{flow.notes}</p>}
      <div className="frames">
        {steps.map((step, i) => {
          const numbers = annotationNumbers(step.screen);
          return (
            <div className="frame" key={step.screen.id}>
              <h2>{i + 1}. {step.screen.title} {step.screen.kind !== "screen" && <small>({step.screen.kind})</small>}</h2>
              <WireframeScreen screen={step.screen} platform={flow.platform} />
              {step.screen.purpose && <p className="purpose">{step.screen.purpose}</p>}
              <ol className="notes">
                {step.screen.annotations.map((a) => (
                  <li key={a.id}><b>{numbers.get(a.id)}</b> <span>{LABEL[a.type]}:</span> {a.text}</li>
                ))}
              </ol>
              {step.next && (
                <p className="next">
                  → <b>{step.next.trigger}</b> [{step.next.kind}]{step.next.condition ? ` if ${step.next.condition}` : ""}
                  {step.loopsBackTo ? ` ↩ back to “${step.loopsBackTo.title}”` : ""}
                </p>
              )}
              {step.alternatives.length > 0 && (
                <p className="alt">or: {step.alternatives.map((t) => `${t.trigger} [${t.kind}]`).join(" · ")}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PAGE_CSS = `
  body { margin: 24px; font-family: ui-monospace, Menlo, Consolas, monospace; color: #1c1c1c; background: #fff; }
  h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 13px; margin: 0 0 6px; } small { color: #858585; }
  .meta { color: #474747; font-size: 12px; margin: 2px 0; }
  .frames { display: flex; flex-wrap: wrap; gap: 28px; margin-top: 18px; }
  .frame { break-inside: avoid; page-break-inside: avoid; }
  .purpose { font-style: italic; color: #474747; font-size: 11px; max-width: 320px; }
  .notes { padding: 0; list-style: none; font-size: 11px; max-width: 320px; }
  .notes li { margin: 3px 0; } .notes b { display: inline-grid; place-items: center; min-width: 16px; height: 16px; border-radius: 8px; background: #474747; color: #fff; font-size: 9px; }
  .notes span { color: #474747; font-weight: bold; text-transform: uppercase; font-size: 10px; }
  .next, .alt { font-size: 11px; max-width: 320px; } .alt { color: #474747; }
  @media print { body { margin: 10mm; } }
`;

export function storyboardHtml(flow: Flow, steps: PathStep[]): string {
  const body = renderToStaticMarkup(<PrintStoryboard flow={flow} steps={steps} />);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(flow.title)} — storyboard</title><style>${wireframeCss}${PAGE_CSS}</style></head><body>${body}</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Opens the printable storyboard in a new tab and triggers print; falls back to downloading the HTML. */
export function printStoryboard(flow: Flow, steps: PathStep[]): void {
  const html = storyboardHtml(flow, steps);
  const w = window.open("", "_blank");
  if (!w) {
    downloadText(`${slug(flow.title)}.storyboard.html`, html, "text/html");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
  setTimeout(() => w.print(), 400);
}

export function downloadStoryboardHtml(flow: Flow, steps: PathStep[]): void {
  downloadText(`${slug(flow.title)}.storyboard.html`, storyboardHtml(flow, steps), "text/html");
}
