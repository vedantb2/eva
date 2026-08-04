import {
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
 * Resolving an arbitrary name needs Tabler's whole export map, which is ~2.5 MB
 * of JS. Reaching that map only through a dynamic `import()` keeps it in its own
 * async chunk, so the handful of screens that render a custom tab icon pay for
 * it instead of every visitor downloading it in the initial bundle.
 */
interface TablerIconByNameProps {
  name: string;
  className?: string;
}

/**
 * `lazy()` components must be stable across renders — a fresh one each render
 * would suspend forever — so each name gets exactly one, cached module-side.
 */
const lazyIcons = new Map<
  string,
  LazyExoticComponent<ComponentType<{ className?: string }>>
>();

function lazyIconFor(name: string) {
  const cached = lazyIcons.get(name);
  if (cached) {
    return cached;
  }

  const Icon = lazy(async () => {
    const { resolveTablerIcon } = await import("@/lib/utils/tablerIcon");
    return { default: resolveTablerIcon(name) };
  });

  lazyIcons.set(name, Icon);
  return Icon;
}

export function TablerIconByName({ name, className }: TablerIconByNameProps) {
  const Icon = lazyIconFor(name);

  // The fallback doubles as the unknown-name placeholder, so the icon slot keeps
  // its size and only swaps shape once the chunk lands (first render only).
  return (
    <Suspense fallback={<IconLayoutGrid className={className} />}>
      <Icon className={className} />
    </Suspense>
  );
}
