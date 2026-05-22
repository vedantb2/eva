import * as esbuild from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, "..");
const entry = join(backendRoot, "callback-src/index.ts");
const outJs = join(backendRoot, "callback-src/.build/bundle.js");
const outTs = join(backendRoot, "convex/_daytona/callbackScript.generated.ts");

mkdirSync(dirname(outJs), { recursive: true });
mkdirSync(dirname(outTs), { recursive: true });

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: outJs,
  logLevel: "info",
});

const bundled = readFileSync(outJs, "utf8");
const escaped = bundled.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");

writeFileSync(
  outTs,
  `"use node";\n\nexport const CALLBACK_SCRIPT = \`${escaped}\`.trim();\n`,
  "utf8",
);

console.log("Wrote", outTs, "(" + bundled.length, "bytes bundled)");
