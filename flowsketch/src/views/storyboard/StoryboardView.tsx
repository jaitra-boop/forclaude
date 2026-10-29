/**
 * Storyboard: the flow as sequential frames along one path. Pure function of
 * the store; path choices are UI state, everything else is the model.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { actions, activeFlow, useStore } from "../../store/store";
import { computePath, enumeratePaths, offPathScreens, type PathStep } from "../../model/paths";
import type { Flow, Screen, Transition, TransitionKind } from "../../model/schema";
import { annotationNumbers } from "../../wireframe/WireframeScreen";
import { ANNOTATION_TYPE_LABEL } from "../../panels/Inspector";
import { EditableFrame, ElementPalette, FrameDndProvider } from "./EditableFrame";
import { printStoryboard } from "../../export/storyboardHtml";

const LINE_STYLE: Record<TransitionKind, string> = { happy: "solid", error: "dashed", alternate: "dashed", back: "dotted" };

export function StoryboardView() {
  const flow = useStore((s) => activeFlow(s));
  const choices = useStore((s) => (flow ? s.pathChoices[flow.id] : undefined));
  const selection = useStore((s) => s.selection);
  const [pinMode, setPinMode] = useState(false);
  const [showPalette, setShowPalette] = useState(true);

  const steps = useMemo(() => (flow ? computePath(flow, choices ?? {}) : []), [flow, choices]);
  const named = useMemo(() => (flow ? enumeratePaths(flow) : []), [flow]);
  const off = useMemo(() => (flow ? offPathScreens(flow, steps) : []), [flow, steps]);

  if (!flow) return <div className="grid h-full place-items-center text-sm text-neutral-500">No flow yet.</div>;

  const pathKey = steps.map((s) => s.screen.id).join(">");
  const currentNamed = named.findIndex((p) => p.screenIds.join(">") === pathKey);

  const selectedScreenId =
    selection?.kind === "screen" ? selection.id
    : selection?.kind === "element" || selection?.kind === "annotation" ? selection.screenId
    : undefined;
  const paletteTarget = selectedScreenId ?? steps[0]?.screen.id;

  return (
    <FrameDndProvider>
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2">
          <span className="fs-label mb-0">Path</span>
          <select
            className="fs-input w-auto max-w-[260px]"
            value={currentNamed >= 0 ? String(currentNamed) : "custom"}
            onChange={(e) => {
              const p = named[Number(e.target.value)];
              if (p) actions.setPathChoices(p.choices);
            }}
            data-testid="path-select"
          >
            {currentNamed < 0 && <option value="custom">Custom path</option>}
            {named.map((p, i) => <option key={i} value={i}>{p.label} ({p.screenIds.length})</option>)}
          </select>
          <button className="fs-btn" onClick={() => actions.setPathChoices({})}>Reset to happy path</button>
          <span className="mx-1 h-4 w-px bg-neutral-300" />
          <button className={`fs-btn ${pinMode ? "fs-btn-on" : ""}`} onClick={() => setPinMode(!pinMode)} title="Click an element or frame to drop a numbered note pin" data-testid="pin-mode">
            {pinMode ? "Click to drop pin…" : "+ Pin note"}
          </button>
          <button className={`fs-btn ${showPalette ? "fs-btn-on" : ""}`} onClick={() => setShowPalette(!showPalette)}>Palette</button>
          <button className="fs-btn ml-auto" onClick={() => printStoryboard(flow, steps)}>Print / PDF</button>
        </div>
        <div className="flex min-h-0 flex-1">
          {showPalette && (
            <div className="w-36 flex-none overflow-y-auto border-r border-neutral-200 bg-neutral-50 pt-2">
              <ElementPalette targetScreenId={paletteTarget} />
            </div>
          )}
          <div className="min-w-0 flex-1 overflow-auto bg-neutral-100 p-6" onClick={() => actions.select(null)}>
            <div className="flex items-start gap-0" data-testid="storyboard-path">
              {steps.map((step, i) => (
                <StepView key={step.screen.id} flow={flow} step={step} index={i} isLast={i === steps.length - 1} pinMode={pinMode} onPinPlaced={() => setPinMode(false)} selectedScreenId={selectedScreenId} />
              ))}
            </div>
            {off.length > 0 && (
              <div className="mt-10">
                <div className="fs-h">Not on this path ({off.length})</div>
                <div className="flex flex-wrap items-start gap-8">
                  {off.map((s) => (
                    <FrameCard key={s.id} flow={flow} screen={s} label="·" pinMode={pinMode} onPinPlaced={() => setPinMode(false)} selected={selectedScreenId === s.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </FrameDndProvider>
  );
}

function StepView({
  flow, step, index, isLast, pinMode, onPinPlaced, selectedScreenId,
}: {
  flow: Flow; step: PathStep; index: number; isLast: boolean; pinMode: boolean; onPinPlaced: () => void; selectedScreenId?: string;
}) {
  return (
    <>
      <FrameCard flow={flow} screen={step.screen} label={String(index + 1)} pinMode={pinMode} onPinPlaced={onPinPlaced} selected={selectedScreenId === step.screen.id} />
      <Connector flow={flow} step={step} isLast={isLast} />
    </>
  );
}

function FrameCard({
  flow, screen, label, pinMode, onPinPlaced, selected,
}: {
  flow: Flow; screen: Screen; label: string; pinMode: boolean; onPinPlaced: () => void; selected: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const numbers = annotationNumbers(screen);
  const selection = useStore((s) => s.selection);
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selected]);
  const isStart = flow.startScreenId === screen.id;
  return (
    <div
      ref={ref}
      className="flex-none rounded-md p-2"
      style={{ outline: selected ? "2px dashed #1c1c1c" : "none", outlineOffset: 2 }}
      onClick={(e) => e.stopPropagation()}
      data-testid={`frame-${screen.id}`}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-xs">
        <span className="grid h-5 min-w-5 place-items-center rounded-sm border border-neutral-900 px-1 text-[10px] font-bold">{label}</span>
        <button className="truncate font-semibold hover:underline" onClick={() => actions.select({ kind: "screen", id: screen.id })} data-testid="frame-title">
          {screen.title}
        </button>
        {isStart && <span className="rounded-sm bg-neutral-900 px-1 text-[9px] font-bold uppercase text-white">Start</span>}
        {screen.kind !== "screen" && <span className="text-[9px] uppercase tracking-wider text-neutral-500">{screen.kind}</span>}
      </div>
      <EditableFrame screen={screen} platform={flow.platform} pinMode={pinMode} onPinPlaced={onPinPlaced} />
      <div className="mt-2" style={{ width: flow.platform === "mobile" ? 320 : 640 }}>
        {screen.purpose && <div className="mb-1 text-[11px] italic text-neutral-600">{screen.purpose}</div>}
        <ol className="space-y-1">
          {screen.annotations.map((a) => {
            const isSel = selection?.kind === "annotation" && selection.id === a.id;
            return (
              <li
                key={a.id}
                className={`flex cursor-pointer gap-1.5 rounded border bg-white p-1.5 text-[11px] leading-snug ${isSel ? "border-dashed border-neutral-900" : "border-neutral-200"}`}
                onClick={() => actions.select({ kind: "annotation", id: a.id, screenId: screen.id })}
                data-testid={`note-${a.id}`}
              >
                <span className="grid h-4 min-w-4 flex-none place-items-center rounded-full bg-neutral-700 px-1 text-[9px] font-bold text-white">{numbers.get(a.id)}</span>
                <span>
                  <span className="font-semibold uppercase tracking-wide text-neutral-500">{ANNOTATION_TYPE_LABEL[a.type]} · </span>
                  {a.text || <em className="text-neutral-400">empty note</em>}
                </span>
              </li>
            );
          })}
        </ol>
        <button className="mt-1 text-[11px] text-neutral-500 hover:text-neutral-900" onClick={() => actions.addAnnotation({ screenId: screen.id })}>
          + note
        </button>
      </div>
    </div>
  );
}

function TransitionChip({ flow, t, active }: { flow: Flow; t: Transition; active?: boolean }) {
  const to = flow.screens.find((s) => s.id === t.to)?.title ?? "?";
  return (
    <button
      className={`fs-chip ${active ? "border-neutral-900 font-semibold" : ""}`}
      onClick={() => {
        actions.setPathChoice(t.from, t.id);
        actions.select({ kind: "transition", id: t.id });
      }}
      data-testid={`branch-${t.id}`}
      title={t.condition ? `If ${t.condition}` : undefined}
    >
      <span className="uppercase text-[9px] tracking-wider text-neutral-500">{t.kind}</span> {t.trigger} → {to}
    </button>
  );
}

function Connector({ flow, step, isLast }: { flow: Flow; step: PathStep; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const selection = useStore((s) => s.selection);
  const t = step.next;
  const selected = t && selection?.kind === "transition" && selection.id === t.id;
  return (
    <div className="flex w-44 flex-none flex-col items-stretch px-2 pt-40" onClick={(e) => e.stopPropagation()}>
      {t ? (
        <button
          className="group flex flex-col items-stretch text-left"
          onClick={() => actions.select({ kind: "transition", id: t.id })}
          data-testid={`arrow-${t.id}`}
          style={{ outline: selected ? "2px dashed #1c1c1c" : "none", outlineOffset: 3, borderRadius: 4 }}
        >
          <div className="mb-1 text-center text-[11px] font-medium leading-tight text-neutral-800">{t.trigger}</div>
          <div className="flex items-center">
            <div className="flex-1" style={{ borderTop: `2px ${LINE_STYLE[t.kind]} #1c1c1c` }} />
            <span className="-ml-1 text-sm leading-none">▶</span>
          </div>
          <div className="mt-1 text-center text-[9px] uppercase tracking-wider text-neutral-500">
            {t.kind}
            {step.loopsBackTo && <> · ↩ back to “{step.loopsBackTo.title}”</>}
          </div>
          {t.condition && <div className="text-center text-[10px] italic text-neutral-500">if {t.condition}</div>}
          {t.annotations.map((a) => (
            <div key={a.id} className="mt-1 rounded border border-neutral-200 bg-white p-1 text-[10px] leading-snug" onClick={(e) => { e.stopPropagation(); actions.select({ kind: "annotation", id: a.id, transitionId: t.id }); }}>
              <span className="font-semibold uppercase text-neutral-500">{ANNOTATION_TYPE_LABEL[a.type]} · </span>{a.text}
            </div>
          ))}
        </button>
      ) : (
        <div className="text-center text-[10px] uppercase tracking-wider text-neutral-400">{isLast ? "End of path" : ""}</div>
      )}
      {step.alternatives.length > 0 && (
        <div className="mt-3 flex flex-col items-start gap-1" data-testid={`branches-${step.screen.id}`}>
          <button className="fs-chip" onClick={() => setOpen(!open)} data-testid={`or-chip-${step.screen.id}`}>
            or… ({step.alternatives.length}) {open ? "▴" : "▾"}
          </button>
          {open && step.alternatives.map((alt) => <TransitionChip key={alt.id} flow={flow} t={alt} />)}
        </div>
      )}
    </div>
  );
}
