import type { Plugin } from "vite";

/**
 * Rewrites named barrel imports of @tabler/icons-react to per-file deep
 * paths, at build time only.
 *
 * A package whose entry re-exports thousands of modules lands in the eager
 * module graph as soon as anything imports a single member from it, and drags
 * the rest along with it. Rewriting `import { IconX } from "@tabler/icons-react"`
 * to `import IconX from ".../icons/IconX.mjs"` means the barrel is never
 * loaded.
 *
 * Build-only on purpose: in dev each deep path is its own optimizer entry, so
 * every newly visited route would re-bundle deps and force a page reload. Dev
 * keeps the barrel, which the optimizer pre-bundles once.
 *
 * This used to wrap @rolldown/plugin-transform-imports, which AST-parses
 * every matching module in JS. In this repo the problem is regex-shaped —
 * import clauses cannot nest braces, and only ~300 first-party files import
 * icons — so the dependency is replaced by ~40 lines. The regex rewrite
 * produces byte-identical dist output (verified chunk-hash-for-chunk-hash;
 * measured handler cost: 290 calls, 14 ms total — do not trust
 * PLUGIN_TIMINGS percentages, they attribute wall-span, not CPU). Members
 * that do not look like `IconX` (e.g. `type Icon as TablerIcon`) keep a
 * residual barrel import, which rolldown tree-shakes; TanStack Router's
 * code-split ids (`route.tsx?tsr-split=...`) are matched by the id filter —
 * missing them silently reintroduces the barrel, which is how the previous
 * version hid a regression for months.
 */
const IMPORT_RE =
  /import\s*\{([^}]*)\}\s*from\s*(["'])@tabler\/icons-react\2;?/g;
const MEMBER_RE = /^(Icon\w+)(?:\s+as\s+(\w+))?$/;

export function tablerDeepImports(): Plugin {
  return {
    name: "eva-tabler-deep-imports",
    apply: "build",
    transform: {
      filter: {
        id: {
          include: /\.[jt]sx?(?:\?.*)?$/,
          // Nothing under node_modules imports the tabler barrel; excluding
          // it here keeps ~3,000 dependency modules on the native side.
          exclude: /node_modules/,
        },
        code: { include: "@tabler/icons-react" },
      },
      handler(code) {
        let changed = false;
        const out = code.replace(IMPORT_RE, (statement, members: string) => {
          const deep: string[] = [];
          const keep: string[] = [];
          for (const raw of members.split(",")) {
            const member = raw.trim();
            if (!member) continue;
            const match = member.match(MEMBER_RE);
            if (match) {
              const local = match[2] ?? match[1];
              deep.push(
                `import ${local} from "@tabler/icons-react/dist/esm/icons/${match[1]}.mjs";`,
              );
            } else {
              keep.push(member);
            }
          }
          if (deep.length === 0) return statement;
          changed = true;
          if (keep.length > 0) {
            deep.push(
              `import { ${keep.join(", ")} } from "@tabler/icons-react";`,
            );
          }
          return deep.join("\n");
        });
        if (changed) return { code: out, map: null };
      },
    },
  };
}
