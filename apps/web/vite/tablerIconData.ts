import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:tabler-icon-data";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/**
 * Extracts every icon's `__iconNode` from @tabler/icons-react's generated
 * per-icon modules and exposes the whole set as one virtual module:
 * `{ [reactName]: ["outline" | "filled", nodes] }`.
 *
 * This exists so `TablerIconByName` can resolve a free-text icon name (custom
 * app tabs store e.g. "IconBolt") without importing the 6095-export barrel.
 * The barrel used to drag ~6,100 modules into every build (~7s on Vercel) and
 * a 2.5 MB lazy chunk; this emits the same data as a single lazy module.
 *
 * The react package (not @tabler/icons' tabler-nodes-*.json) is the source so
 * names match the react exports exactly — the kebab JSONs drop icons like
 * Icon123/Icon2fa whose names don't round-trip through kebab-case.
 */
function buildModuleSource(): string {
  const require = createRequire(import.meta.url);
  const iconsDir = path.join(
    path.dirname(require.resolve("@tabler/icons-react/package.json")),
    "dist",
    "esm",
    "icons",
  );

  const entries: string[] = [];
  for (const file of readdirSync(iconsDir)) {
    // Skips index.mjs (the per-directory barrel) and source maps.
    if (!/^Icon.+\.mjs$/.test(file)) continue;
    const name = file.slice(0, -".mjs".length);
    const source = readFileSync(path.join(iconsDir, file), "utf8");
    const nodeMatch = source.match(/^const __iconNode = (.+);$/m);
    const variantMatch = source.match(
      /createReactComponent\("(outline|filled)"/,
    );
    if (!nodeMatch || !variantMatch) {
      throw new Error(
        `tablerIconData: unexpected icon module shape in ${file}`,
      );
    }
    // The matched text is Tabler's own generated array literal, spliced in
    // verbatim — parsing and re-serialising 6,000 of them here dominated the
    // whole build when tried. The `"key": "svg-N"` attrs are dead weight (the
    // consumer keys by index), so they are stripped textually.
    const nodes = nodeMatch[1].replace(/ "key": "svg-\d+",?/g, "");
    entries.push(
      `${JSON.stringify(name)}:[${JSON.stringify(variantMatch[1])},${nodes}]`,
    );
  }

  return `export default {${entries.join(",")}};`;
}

export function tablerIconData(): Plugin {
  let cache: string | undefined;
  // Hook filters are load-bearing: without them rolldown calls these hooks in
  // JS for EVERY module resolution/load in the build (measured at ~71% of
  // plugin time on Vercel — the same trap as a filterless debug hook, which
  // clocked 85%). With them, native code skips JS except for this exact id.
  return {
    name: "eva-tabler-icon-data",
    resolveId: {
      filter: { id: /^virtual:tabler-icon-data$/ },
      handler(id) {
        if (id === VIRTUAL_ID) return RESOLVED_ID;
      },
    },
    load: {
      filter: { id: /^\0virtual:tabler-icon-data$/ },
      handler(id) {
        if (id === RESOLVED_ID) {
          cache ??= buildModuleSource();
          return cache;
        }
      },
    },
  };
}
