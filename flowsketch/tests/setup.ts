// jsdom gaps that React Flow needs.
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const g = globalThis as Record<string, unknown>;
g.ResizeObserver ??= RO;
g.DOMMatrixReadOnly ??= class {
  m22 = 1;
  constructor() {}
};
if (typeof window !== "undefined") {
  Element.prototype.scrollIntoView ??= function () {};
}
