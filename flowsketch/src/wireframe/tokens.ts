/**
 * The fixed grayscale palette for wireframes. Wireframes use ONLY these values:
 * no color, no gradients, no shadows. App chrome reuses the same grays.
 */
export const gray = {
  ink: "#1c1c1c",   // outlines, primary text, primary button fill
  g700: "#474747",  // secondary text, annotation pins
  g500: "#858585",  // placeholder text, image X
  g300: "#c4c4c4",  // input borders, dividers
  g200: "#dedede",  // image boxes, progress track
  g100: "#efefef",  // subtle fills (cards, nav)
  paper: "#ffffff", // screen background
} as const;

export const wireFont = `"Comic Mono", "Comic Neue", ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`;

/** Logical screen widths. Thumbnails scale these down with a CSS transform. */
export const screenWidth = { mobile: 320, desktop: 640 } as const;
export const screenMinHeight = { mobile: 560, desktop: 400 } as const;

/** CSS custom properties applied on every wireframe root. */
export const tokenVars: Record<string, string> = {
  "--wf-ink": gray.ink,
  "--wf-g700": gray.g700,
  "--wf-g500": gray.g500,
  "--wf-g300": gray.g300,
  "--wf-g200": gray.g200,
  "--wf-g100": gray.g100,
  "--wf-paper": gray.paper,
  "--wf-font": wireFont,
};
