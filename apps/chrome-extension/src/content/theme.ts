export type ExtensionAppearance = "light" | "neutral" | "dark";

function readAppearance(): ExtensionAppearance {
  const root = document.documentElement;
  if (root.classList.contains("neutral")) return "neutral";
  if (root.classList.contains("dark")) return "dark";
  return "light";
}

let _appearance = readAppearance();
const _subs = new Set<() => void>();

new MutationObserver(() => {
  const next = readAppearance();
  if (next !== _appearance) {
    _appearance = next;
    _subs.forEach((s) => s());
  }
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class"],
});

export function subscribeAppearance(cb: () => void): () => void {
  _subs.add(cb);
  return () => {
    _subs.delete(cb);
  };
}

export function getAppearance(): ExtensionAppearance {
  return _appearance;
}
