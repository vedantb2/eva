import { defineConfig, build as viteBuild } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, readdirSync } from "fs";

function copyStaticFiles() {
  return {
    name: "copy-static-files",
    closeBundle() {
      copyFileSync("manifest.json", "dist/manifest.json");

      if (!existsSync("dist/icons")) {
        mkdirSync("dist/icons", { recursive: true });
      }

      if (existsSync("public/icons")) {
        const icons = readdirSync("public/icons");
        for (const icon of icons) {
          copyFileSync(`public/icons/${icon}`, `dist/icons/${icon}`);
        }
      }
    },
  };
}

function buildContentScript() {
  return {
    name: "build-content-script",
    async closeBundle() {
      await viteBuild({
        configFile: false,
        root: resolve(__dirname),
        plugins: [react()],
        resolve: {
          alias: { "@": resolve(__dirname, "src") },
        },
        css: {
          postcss: {
            plugins: [
              tailwindcss({ config: resolve(__dirname, "tailwind.config.js") }),
              autoprefixer(),
            ],
          },
        },
        esbuild: { charset: "ascii" },
        logLevel: "warn",
        build: {
          minify: "esbuild",
          write: true,
          outDir: resolve(__dirname, "dist"),
          emptyOutDir: false,
          rollupOptions: {
            input: { content: resolve(__dirname, "src/content/index.ts") },
            output: {
              format: "iife",
              dir: resolve(__dirname, "dist"),
              entryFileNames: "[name].js",
              inlineDynamicImports: true,
            },
          },
        },
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyStaticFiles(), buildContentScript()],
  base: "",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    ...(process.argv.includes("--watch") && {
      watch: {
        exclude: [
          resolve(__dirname, "../web/**"),
          resolve(__dirname, "../mobile/**"),
          resolve(__dirname, "../teams-bot/**"),
        ],
      },
    }),
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel.html"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
