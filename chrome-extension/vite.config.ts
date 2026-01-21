import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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

export default defineConfig({
  plugins: [react(), copyStaticFiles()],
  base: "",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
