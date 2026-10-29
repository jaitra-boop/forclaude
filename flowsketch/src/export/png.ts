import { toPng } from "html-to-image";
import { getViewportForBounds } from "@xyflow/react";
import { nodeSize } from "../model/layout";
import type { Flow } from "../model/schema";
import { gray } from "../wireframe/tokens";
import { slug } from "./download";

/** Renders the whole flow view (not just what's on screen) to a PNG download. */
export async function exportFlowPng(flow: Flow): Promise<void> {
  const viewport = document.querySelector<HTMLElement>(".fs-flow .react-flow__viewport");
  if (!viewport || flow.screens.length === 0) return;
  const size = nodeSize(flow.platform);
  const xs = flow.screens.map((s) => s.position.x);
  const ys = flow.screens.map((s) => s.position.y);
  const pad = 120; // room for edge labels and loops
  const bounds = {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - pad,
    width: Math.max(...xs) - Math.min(...xs) + size.width + pad * 2,
    height: Math.max(...ys) - Math.min(...ys) + size.height + pad * 2,
  };
  const scale = 2;
  const width = Math.min(8000, Math.ceil(bounds.width));
  const height = Math.min(8000, Math.ceil(bounds.height));
  const vp = getViewportForBounds(bounds, width, height, 0.1, 2, 0);
  const dataUrl = await toPng(viewport, {
    backgroundColor: gray.paper,
    width,
    height,
    pixelRatio: scale,
    style: { width: `${width}px`, height: `${height}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${slug(flow.title)}.flow.png`;
  a.click();
}
