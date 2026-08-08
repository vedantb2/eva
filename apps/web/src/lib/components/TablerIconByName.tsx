import {
  createElement,
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { IconLayoutGrid } from "@tabler/icons-react";

/**
 * Renders a Tabler icon chosen at runtime by name (custom app tabs store the
 * name as free text, e.g. "IconBolt").
 *
 * Resolving an arbitrary name needs every icon's path data. That comes from
 * `virtual:tabler-icon-data` (see apps/web/vite/tablerIconData.ts) — a single
 * lazy module of raw SVG nodes — instead of Tabler's 6095-export barrel, which
 * used to pull ~6,100 modules into every build. Only screens that render a
 * custom tab icon download the data; everyone else pays nothing.
 */
interface TablerIconByNameProps {
  name: string;
  className?: string;
}

interface IconProps {
  className?: string;
}

// Mirrors @tabler/icons-react's defaultAttributes so data-rendered icons are
// pixel-identical to the statically imported components.
const SVG_ATTRS: Record<
  "outline" | "filled",
  Record<string, string | number>
> = {
  outline: {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  filled: {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "none",
  },
};

function iconFromData(
  variant: "outline" | "filled",
  nodes: [string, Record<string, string | number>][],
): ComponentType<IconProps> {
  return function TablerDataIcon({ className }: IconProps) {
    return (
      <svg {...SVG_ATTRS[variant]} className={className}>
        {nodes.map(([tag, attrs], index) =>
          createElement(tag, { ...attrs, key: index }),
        )}
      </svg>
    );
  };
}

/**
 * `lazy()` components must be stable across renders — a fresh one each render
 * would suspend forever — so each name gets exactly one, cached module-side.
 */
const lazyIcons = new Map<
  string,
  LazyExoticComponent<ComponentType<IconProps>>
>();

function lazyIconFor(name: string) {
  const cached = lazyIcons.get(name);
  if (cached) {
    return cached;
  }

  const Icon = lazy(async () => {
    const { default: icons } = await import("virtual:tabler-icon-data");
    const spec = icons[name];
    return { default: spec ? iconFromData(spec[0], spec[1]) : IconLayoutGrid };
  });

  lazyIcons.set(name, Icon);
  return Icon;
}

export function TablerIconByName({ name, className }: TablerIconByNameProps) {
  const Icon = lazyIconFor(name);

  // The fallback doubles as the unknown-name placeholder, so the icon slot keeps
  // its size and only swaps shape once the data lands (first render only).
  return (
    <Suspense fallback={<IconLayoutGrid className={className} />}>
      <Icon className={className} />
    </Suspense>
  );
}
