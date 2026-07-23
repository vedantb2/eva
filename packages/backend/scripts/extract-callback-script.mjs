import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(__dirname, "../convex/_sandbox_runtime/callbackScript.ts");
const outPath = join(__dirname, "../callback-src/_extracted.mjs");

const text = readFileSync(sourcePath, "utf8");
const marker = "export const CALLBACK_SCRIPT = `";
const start = text.indexOf(marker) + marker.length;
const end = text.lastIndexOf("`.trim();");
if (start < marker.length || end <= start) {
  throw new Error("Could not locate CALLBACK_SCRIPT template literal");
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, text.slice(start, end));
console.log("Extracted", end - start, "bytes to", outPath);
