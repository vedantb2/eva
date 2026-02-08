let _dark = document.documentElement.classList.contains("dark");
const _subs = new Set<() => void>();

new MutationObserver(() => {
  const next = document.documentElement.classList.contains("dark");
  if (next !== _dark) {
    _dark = next;
    _subs.forEach((s) => s());
  }
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class"],
});

export function subscribeDark(cb: () => void) {
  _subs.add(cb);
  return () => {
    _subs.delete(cb);
  };
}

export function getDark() {
  return _dark;
}
