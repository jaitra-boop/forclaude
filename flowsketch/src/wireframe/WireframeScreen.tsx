/**
 * The one wireframe renderer, used by the flow-view node thumbnails, the
 * storyboard frames and the print export, so every view always matches.
 * Pure HTML/CSS: a vertical stack of elements, with `props.row` grouping.
 */
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { Element, Platform, Screen } from "../model/schema";
import { ELEMENT_RENDERERS } from "./elements";
import { screenMinHeight, screenWidth, tokenVars } from "./tokens";
import "./wireframe.css";

export interface WireframeScreenProps {
  screen: Screen;
  platform: Platform;
  selectedElementId?: string;
  selectedAnnotationId?: string;
  onElementClick?: (elementId: string, e: MouseEvent) => void;
  onBackgroundClick?: (e: MouseEvent) => void;
  onPinClick?: (annotationId: string) => void;
  /** Lets the storyboard wrap each element (drag handles, sortable). */
  wrapElement?: (el: Element, node: ReactNode) => ReactNode;
  showPins?: boolean;
  className?: string;
}

/** 1-based pin numbers for a screen's annotations, in list order. */
export function annotationNumbers(screen: Screen): Map<string, number> {
  return new Map(screen.annotations.map((a, i) => [a.id, i + 1]));
}

type Group = { row?: string; elements: Element[] };

export function groupRows(elements: Element[]): Group[] {
  const groups: Group[] = [];
  for (const el of elements) {
    const row = typeof el.props.row === "string" && el.props.row !== "" ? el.props.row : undefined;
    const last = groups[groups.length - 1];
    if (row && last?.row === row) last.elements.push(el);
    else groups.push({ row, elements: [el] });
  }
  return groups;
}

export function WireframeScreen({
  screen,
  platform,
  selectedElementId,
  selectedAnnotationId,
  onElementClick,
  onBackgroundClick,
  onPinClick,
  wrapElement,
  showPins = true,
  className = "",
}: WireframeScreenProps) {
  const numbers = annotationNumbers(screen);
  const pinsFor = (elementId?: string) =>
    showPins
      ? screen.annotations
          .filter((a) => a.targetElementId === elementId)
          .map((a) => (
            <span
              key={a.id}
              className={`wf-pin${a.id === selectedAnnotationId ? " wf-pin-selected" : ""}`}
              title={`${a.type}: ${a.text}`}
              data-annotation-id={a.id}
              onClick={(e) => {
                if (!onPinClick) return;
                e.stopPropagation();
                onPinClick(a.id);
              }}
            >
              {numbers.get(a.id)}
            </span>
          ))
      : null;

  const renderEl = (el: Element) => {
    const classes = ["wf-el-wrap"];
    if (onElementClick) classes.push("wf-clickable");
    if (el.id === selectedElementId) classes.push("wf-selected");
    if (el.linkTo) classes.push("wf-linked");
    const style: CSSProperties | undefined = el.type === "nav-bar" ? { marginTop: "auto" } : undefined;
    const node = (
      <div
        key={el.id}
        className={classes.join(" ")}
        style={style}
        data-element-id={el.id}
        data-element-type={el.type}
        onClick={
          onElementClick
            ? (e) => {
                e.stopPropagation();
                onElementClick(el.id, e);
              }
            : undefined
        }
      >
        {ELEMENT_RENDERERS[el.type](el)}
        {pinsFor(el.id)}
      </div>
    );
    return wrapElement ? <WrapKey key={el.id}>{wrapElement(el, node)}</WrapKey> : node;
  };

  const style = {
    ...tokenVars,
    width: screenWidth[platform],
    minHeight: screenMinHeight[platform],
  } as CSSProperties;

  return (
    <div
      className={`wf-root wf-${platform} wf-kind-${screen.kind} ${className}`}
      style={style}
      data-screen-id={screen.id}
      onClick={onBackgroundClick}
    >
      {platform === "desktop" && (
        <div className="wf-chrome"><i /><i /><i /></div>
      )}
      {screen.kind !== "screen" && <span className="wf-kind-tag">{screen.kind}</span>}
      {showPins && <div className="wf-screen-pins">{pinsFor(undefined)}</div>}
      <div className="wf-body">
        {screen.elements.length === 0 && <div className="wf-empty">Empty screen</div>}
        {groupRows(screen.elements).map((g, i) =>
          g.row ? (
            <div className="wf-row" key={`row-${i}-${g.row}`}>{g.elements.map(renderEl)}</div>
          ) : (
            renderEl(g.elements[0]!)
          ),
        )}
      </div>
    </div>
  );
}

function WrapKey({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** A WireframeScreen scaled down to fit a box (flow-view thumbnails). */
export function ScaledWireframe({ screen, platform, scale, height }: { screen: Screen; platform: Platform; scale: number; height: number }) {
  return (
    <div style={{ width: screenWidth[platform] * scale, height, overflow: "hidden", position: "relative" }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        <WireframeScreen screen={screen} platform={platform} />
      </div>
    </div>
  );
}
