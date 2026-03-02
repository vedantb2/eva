export function cssColor(name: string, alpha = 1): string {
  if (typeof document === "undefined") return "transparent";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
  return `oklch(${v} / ${alpha})`;
}

/** Returns the theme's --radius value in pixels (for use with non-CSS APIs like Chart.js) */
export function cssRadius(): number {
  if (typeof document === "undefined") return 8;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--radius")
    .trim();
  if (v.endsWith("rem")) return parseFloat(v) * 16;
  if (v.endsWith("px")) return parseFloat(v);
  return 8;
}
