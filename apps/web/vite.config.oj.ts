// Experimental: used only by `oj dev --config vite.config.oj.ts`.
//
// oj 0.1.4 cannot run `vite.config.ts` as-is. Both overrides below work around
// an oj bug; neither is needed by Vite.
//
//  1. @tanstack/router-plugin's code-splitter: oj's plugin host calls
//     `applyToEnvironment` before the `config` hook, so the plugin's
//     `userConfig` is still undefined and it throws. oj reacts by dropping the
//     WHOLE config, so every plugin disappears. Dropped here instead;
//     `src/routeTree.gen.ts` is committed, so a dev boot survives without it.
//  2. `virtual:tabler-icon-data`: oj rewrites the import to `/@id/<hex>` but
//     its own `/@id/` route 404s on that id, so the app never mounts. Served
//     from a real file under `.oj-virtual/` instead, which `/@fs/` handles.
//
// The third incompatibility — oj resolving a stylesheet's `@config` from the
// Vite root rather than the stylesheet — has no plugin-level fix, because oj
// never routes CSS through the JS plugin host. It is worked around in
// `src/globals.css` + `src/tailwind.config.js`.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin, PluginOption } from "vite";
import baseConfig from "./vite.config";
import { buildTablerIconDataSource } from "./vite/tablerIconData";

/** Same module contents as `tablerIconData()`, but as a real file on disk. */
function tablerIconDataOnDisk(): Plugin {
  let file: string | undefined;
  return {
    name: "eva-tabler-icon-data-oj",
    resolveId: {
      filter: { id: /^virtual:tabler-icon-data$/ },
      handler() {
        if (file === undefined) {
          const dir = path.resolve(import.meta.dirname, ".oj-virtual");
          mkdirSync(dir, { recursive: true });
          file = path.join(dir, "tabler-icon-data.js");
          writeFileSync(file, buildTablerIconDataSource(), "utf8");
        }
        return file;
      },
    },
  };
}

function replacePlugin(option: PluginOption): PluginOption {
  if (Array.isArray(option)) return option.map(replacePlugin);
  if (option !== null && typeof option === "object" && "name" in option) {
    const { name } = option;
    if (typeof name === "string") {
      if (name.startsWith("tanstack-router:code-splitter")) return false;
      if (name === "eva-tabler-icon-data") return tablerIconDataOnDisk();
    }
  }
  return option;
}

export default {
  ...baseConfig,
  plugins: (Array.isArray(baseConfig.plugins) ? baseConfig.plugins : []).map(
    replacePlugin,
  ),
};
