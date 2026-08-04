import transformImports, {
  type TransformImportsOptions,
} from "@rolldown/plugin-transform-imports";

/**
 * The plugin is a rolldown plugin, not a Vite one. Vite declares `resolveId`'s
 * options with an optional `kind`, so the two `Plugin` types are not mutually
 * assignable even though Vite runs rolldown plugins natively. Keeping the
 * package's own type avoids a cast.
 */
type BuildOnlyPlugin = ReturnType<typeof transformImports> & {
  apply: "build";
};

/**
 * Rewrites named barrel imports to per-file deep paths, at build time only.
 *
 * A package whose entry re-exports hundreds of modules lands in the eager
 * module graph as soon as anything imports a single member from it, and drags
 * the rest along with it. Rewriting `import { X } from "pkg"` to
 * `import X from "pkg/dist/X.mjs"` means the barrel is never loaded.
 *
 * Build-only on purpose: in dev each deep path is its own optimizer entry, so
 * every newly visited route would re-bundle deps and force a page reload. Dev
 * keeps the barrel, which the optimizer pre-bundles once.
 *
 * Works for any package with a fat entry and a one-file-per-export dist —
 * `lucide-react`, `@mui/icons-material`, `react-icons/*`, `date-fns`.
 * Requires Vite 8 / rolldown; Next.js has this built in as
 * `experimental.optimizePackageImports`.
 */
export function buildOnlyDeepImports(
  options: TransformImportsOptions,
): BuildOnlyPlugin {
  return { ...transformImports(options), apply: "build" };
}

/**
 * Keeps Tabler's 6095-icon barrel out of the eager graph (~2.5 MB / 489 kB gzip).
 *
 * `^Icon.+$` deliberately excludes the bare `Icon` type export — there is no
 * `icons/Icon.mjs`. Members that do not match keep their original import.
 */
export function tablerDeepImports(): BuildOnlyPlugin {
  return buildOnlyDeepImports({
    "@tabler/icons-react": {
      transform: [
        ["^Icon.+$", "@tabler/icons-react/dist/esm/icons/{{member}}.mjs"],
      ],
    },
  });
}
