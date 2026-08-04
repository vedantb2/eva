import * as TablerIcons from "@tabler/icons-react";
import { IconLayoutGrid, type TablerIcon } from "@tabler/icons-react";

// Custom tabs store a free-text Tabler icon name (e.g. "IconBolt"). Tabler ships
// no runtime name -> component resolver, so we build one from the namespace
// import. This pulls the full icon set in (tree-shaking is lost), so the module
// weighs ~2.5 MB.
//
// IMPORT THIS MODULE DYNAMICALLY ONLY. A static import drags that 2.5 MB into
// the initial bundle for every visitor. `TablerIconByName` is the one caller and
// it goes through `await import()` to keep the weight in a lazy chunk.
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
