import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svgPath = path.join(__dirname, "../apps/web/public/icon.svg");
const outPath = path.join(__dirname, "../packages/backend/convex/mcp/icon.ts");

const svg = fs.readFileSync(svgPath, "utf8").trim();
const base64 = Buffer.from(svg).toString("base64");

const chunks = [];
for (let i = 0; i < base64.length; i += 76) {
  chunks.push(`  "${base64.slice(i, i + 76)}"`);
}

const content = [
  "// Generated from apps/web/public/icon.svg for MCP clients that display server icons.",
  'export const MCP_ICON_MIME_TYPE = "image/svg+xml";',
  'export const MCP_ICON_SIZES = ["any"];',
  "const MCP_ICON_BASE64 =",
  `${chunks.join(" +\n")};`,
  "",
  "export const MCP_ICON_DATA_URI = `data:${MCP_ICON_MIME_TYPE};base64,${MCP_ICON_BASE64}`;",
  "",
].join("\n");

fs.writeFileSync(outPath, content);
console.log(`Wrote ${outPath} (${content.length} bytes)`);
