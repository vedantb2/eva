import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import transformImports from "@rolldown/plugin-transform-imports";
import tanstackRouter from "@tanstack/router-plugin/vite";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

function agentLoginPlugin(): Plugin {
  let env: Record<string, string>;

  return {
    name: "agent-login",
    configureServer(server) {
      env = loadEnv("development", server.config.root, "");

      server.middlewares.use("/api/auth/agent-login", async (_req, res) => {
        const secretKey = env.CLERK_SECRET_KEY;
        const agentUserId = env.AGENT_CLERK_USER_ID;

        if (!secretKey || !agentUserId) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error:
                "CLERK_SECRET_KEY and AGENT_CLERK_USER_ID must be set in .env.local",
            }),
          );
          return;
        }

        const resp = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: agentUserId,
            expires_in_seconds: 60,
          }),
        });

        if (!resp.ok) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Failed to create sign-in token",
              details: await resp.text(),
            }),
          );
          return;
        }

        const data = await resp.json();
        const token = data.token;
        if (typeof token !== "string") {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No token in Clerk response" }));
          return;
        }

        res.writeHead(302, {
          Location: `/agent-callback?ticket=${encodeURIComponent(token)}`,
        });
        res.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: "./src/routes",
      // The generator tests this against each bare directory-entry name (not the
      // full path), so a plain `_utils` excludes both the `_utils.ts` helper file
      // and the `_utils/` folder — mirroring how `_components` is matched.
      routeFileIgnorePattern:
        "(_components|_utils|Client\\.tsx|Panel\\.tsx|\\.test\\.tsx?)",
      autoCodeSplitting: true,
    }),
    react(),
    // `import { IconPlus } from "@tabler/icons-react"` pulls in Tabler's barrel,
    // which re-exports 6095 icons — so the barrel lands in the eager graph and
    // drags every icon with it (~2.5 MB / 489 kB gzip in the initial payload).
    // Rewriting each named import to its own icon file means the barrel is never
    // loaded here; only `tablerIcon.ts` still reads it, behind a dynamic import.
    //
    // `^Icon.+$` deliberately excludes the bare `Icon` type export (there is no
    // `icons/Icon.mjs`); unmatched members keep their original import.
    //
    // Build-only: in dev these deep paths are each a fresh optimizer entry, so
    // every newly visited route would re-bundle deps and force a page reload.
    // Dev keeps the barrel, which the optimizer pre-bundles once.
    {
      ...transformImports({
        "@tabler/icons-react": {
          transform: [
            ["^Icon.+$", "@tabler/icons-react/dist/esm/icons/{{member}}.mjs"],
          ],
        },
      }),
      apply: "build",
    },
    agentLoginPlugin(),
    process.env.ANALYZE === "true" &&
      visualizer({
        filename: "stats.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  server: {
    host: "0.0.0.0",
    cors: false,
  },
  // The @pierre/diffs highlight worker keeps a dynamic `import("shiki/wasm")`
  // that never runs (we stay on the JS highlighter). Vite's default `iife`
  // worker format cannot code-split, so it would inline that ~1MB wasm payload
  // into the worker bundle; ES workers leave it as a lazy chunk.
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Packages using React Context MUST be deduplicated to prevent "Context not found" errors
    // When pnpm installs multiple copies (different peer deps), each has its own context instance
    // This forces all imports to resolve to the same instance at bundle time
    dedupe: [
      "react",
      "react-dom",
      "convex",
      "convex-helpers",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "@clerk/clerk-react",
      "@tiptap/react",
      "@tiptap/core",
      "@convex-dev/prosemirror-sync",
      "@pierre/diffs",
      "@pierre/trees",
      "shiki",
      "frimousse",
      "sonner",
    ],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-radix",
              test: /node_modules[\\/]@radix-ui/,
              priority: 15,
            },
            {
              name: "vendor-convex",
              test: /node_modules[\\/](convex|convex-helpers)/,
              priority: 15,
            },
            {
              name: "vendor-clerk",
              test: /node_modules[\\/]@clerk/,
              priority: 15,
            },
            {
              name: "vendor-streamdown",
              test: /node_modules[\\/](streamdown|@streamdown)/,
              priority: 15,
            },
            {
              name: "vendor-motion",
              test: /node_modules[\\/](motion|framer-motion)/,
              priority: 15,
            },
            {
              name: "vendor-shiki",
              test: /node_modules[\\/]shiki/,
              priority: 20,
            },
            {
              name: "vendor-katex",
              test: /node_modules[\\/]katex/,
              priority: 20,
            },
            {
              name: "vendor-mermaid",
              test: /node_modules[\\/]mermaid/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
});
