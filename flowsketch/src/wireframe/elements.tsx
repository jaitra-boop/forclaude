/**
 * One renderer per element type. To add an element type: add it to
 * ELEMENT_TYPES (schema.ts), give it defaults in defaultElement (ops.ts), and
 * add a renderer here; the Record type makes the compiler insist on all three.
 */
import type { ReactNode } from "react";
import type { Element, ElementType } from "../model/schema";

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const items = (el: Element, fallback: string[]): string[] => {
  const v = el.props.items;
  return Array.isArray(v) && v.length > 0 ? v : fallback;
};

const Cross = () => (
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
    <line x1="0" y1="0" x2="100" y2="100" stroke="var(--wf-g500)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    <line x1="100" y1="0" x2="0" y2="100" stroke="var(--wf-g500)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
  </svg>
);

const Icon = () => (
  <span className="wf-icon">
    <Cross />
  </span>
);

export const ELEMENT_RENDERERS: Record<ElementType, (el: Element) => ReactNode> = {
  header: (el) => (
    <div className="wf-header">
      <span className="wf-icon" style={{ width: 14, height: 14 }}><Cross /></span>
      <span>{el.label}</span>
    </div>
  ),
  heading: (el) => <div className="wf-heading">{el.label}</div>,
  text: (el) => <div className="wf-text">{str(el.props.text, el.label)}</div>,
  "image-placeholder": (el) => (
    <div className="wf-img">
      <Cross />
      {el.label && <span>{el.label}</span>}
    </div>
  ),
  "button-primary": (el) => <div className="wf-btn wf-btn-primary">{el.label}</div>,
  "button-secondary": (el) => <div className="wf-btn wf-btn-secondary">{el.label}</div>,
  "text-input": (el) => (
    <div>
      <div className="wf-label">{el.label}</div>
      <div className="wf-input">{str(el.props.placeholder)}</div>
    </div>
  ),
  textarea: (el) => (
    <div>
      <div className="wf-label">{el.label}</div>
      <div className="wf-input wf-textarea">{str(el.props.placeholder)}</div>
    </div>
  ),
  checkbox: (el) => (
    <div className="wf-check">
      <span className="wf-box">{el.props.checked === true ? "✓" : ""}</span>
      <span>{el.label}</span>
    </div>
  ),
  radio: (el) => (
    <div>
      {el.label && <div className="wf-label">{el.label}</div>}
      {items(el, ["Option"]).map((it, i) => (
        <div className="wf-check" key={i} style={{ marginTop: 4 }}>
          <span className={`wf-dot${i === 0 ? " on" : ""}`} />
          <span>{it}</span>
        </div>
      ))}
    </div>
  ),
  toggle: (el) => (
    <div className="wf-check" style={{ justifyContent: "space-between" }}>
      <span>{el.label}</span>
      <span className={`wf-toggle${el.props.checked === false ? "" : " on"}`} />
    </div>
  ),
  select: (el) => (
    <div>
      <div className="wf-label">{el.label}</div>
      <div className="wf-input wf-select">
        <span>{str(el.props.placeholder, items(el, ["Choose…"])[0])}</span>
        <span>▾</span>
      </div>
    </div>
  ),
  list: (el) => (
    <div>
      {el.label && <div className="wf-label">{el.label}</div>}
      <div className="wf-list">
        {items(el, ["Item"]).map((it, i) => (
          <div className="wf-list-item" key={i}>
            <span className="wf-avatar" />
            <span style={{ flex: 1 }}>{it}</span>
            <span style={{ color: "var(--wf-g500)" }}>›</span>
          </div>
        ))}
      </div>
    </div>
  ),
  card: (el) => (
    <div className="wf-card">
      <div className="wf-card-title">{el.label}</div>
      {str(el.props.text) && <div className="wf-text">{str(el.props.text)}</div>}
    </div>
  ),
  tabs: (el) => (
    <div className="wf-tabs">
      {items(el, ["Tab"]).map((it, i) => (
        <span className={`wf-tab${i === 0 ? " on" : ""}`} key={i}>{it}</span>
      ))}
    </div>
  ),
  "nav-bar": (el) => (
    <div className="wf-nav">
      {items(el, ["Home"]).map((it, i) => (
        <span className="wf-nav-item" key={i}>
          <span className="wf-icon" style={{ width: 14, height: 14 }}><Cross /></span>
          {it}
        </span>
      ))}
    </div>
  ),
  search: (el) => (
    <div className="wf-search">
      <span>⌕</span>
      <span>{str(el.props.placeholder, el.label)}</span>
    </div>
  ),
  banner: (el) => (
    <div className="wf-banner">
      <strong>{el.label}</strong>
      {str(el.props.text) && <div className="wf-text">{str(el.props.text)}</div>}
    </div>
  ),
  toast: (el) => <div className="wf-toast">{str(el.props.text, el.label)}</div>,
  divider: () => <div className="wf-divider" />,
  spacer: () => <div className="wf-spacer" />,
  "icon-placeholder": (el) => (
    <div className="wf-icon-row">
      <Icon />
      {el.label && <span>{el.label}</span>}
    </div>
  ),
  progress: (el) => {
    const v = typeof el.props.value === "number" ? el.props.value : 50;
    return (
      <div>
        {el.label && <div className="wf-label">{el.label}</div>}
        <div className="wf-progress"><div style={{ width: `${Math.max(0, Math.min(100, v))}%` }} /></div>
      </div>
    );
  },
  "form-error": (el) => <div className="wf-error">{el.label}</div>,
};

/** Human labels for the element palette. */
export const ELEMENT_LABELS: Record<ElementType, string> = {
  header: "Header", heading: "Heading", text: "Text", "image-placeholder": "Image",
  "button-primary": "Primary button", "button-secondary": "Secondary button",
  "text-input": "Text input", textarea: "Text area", checkbox: "Checkbox", radio: "Radio group",
  toggle: "Toggle", select: "Select", list: "List", card: "Card", tabs: "Tabs", "nav-bar": "Nav bar",
  search: "Search", banner: "Banner", toast: "Toast", divider: "Divider", spacer: "Spacer",
  "icon-placeholder": "Icon", progress: "Progress", "form-error": "Form error",
};
