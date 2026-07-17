import * as TablerIcons from "@tabler/icons-react";
import { IconLayoutGrid, type TablerIcon } from "@tabler/icons-react";

// Custom tabs store a free-text Tabler icon name (e.g. "IconBolt"). Tabler ships
// no runtime name -> component resolver, so we build one from the namespace
// import. This pulls the full icon set into the bundle (tree-shaking is lost);
// acceptable for this internal platform. If bundle size becomes a concern, swap
// `iconMap` for a curated allowlist without changing callers.
//
// The namespace also exports non-icon members (createReactComponent, iconsList,
// ...), so the filter keeps only `Icon*` forwardRef components.
const iconMap = new Map<string, TablerIcon>(
  Object.entries(TablerIcons).filter(
    (entry): entry is [string, TablerIcon] =>
      entry[0].startsWith("Icon") && typeof entry[1] === "object",
  ),
);

/** Resolves a Tabler icon by name, falling back to a placeholder for typos. */
export function resolveTablerIcon(name: string): TablerIcon {
  return iconMap.get(name) ?? IconLayoutGrid;
}
