import type { CSSProperties } from "react";

/**
 * Maps HeroUI surface tokens onto the tree's themeable custom properties. They
 * inherit through the tree's shadow DOM and resolve to `rgb(var(--token))`, so
 * they re-resolve automatically when the `.dark` class toggles. `colorScheme`
 * (set per render at the call site) pins the tree's `light-dark()` git-status
 * and icon colours to the app theme, since those key off `color-scheme`, not
 * the class. Typed via index signature so CSS custom properties are allowed.
 */
export const treeThemeVars: CSSProperties & Record<`--${string}`, string> = {
  "--trees-bg-override": "rgb(var(--background))",
  "--trees-fg-override": "rgb(var(--foreground))",
  "--trees-fg-muted-override": "rgb(var(--muted-foreground))",
  "--trees-bg-muted-override": "rgb(var(--muted))",
  "--trees-border-color-override": "rgb(var(--border))",
  "--trees-accent-override": "rgb(var(--primary))",
  "--trees-focus-ring-color-override": "rgb(var(--ring))",
  // The tree defaults to `system-ui`; point it at the app's own sans stack so
  // it follows the user's theme font like every other surface.
  "--trees-font-family-override": "var(--font-sans)",
};
