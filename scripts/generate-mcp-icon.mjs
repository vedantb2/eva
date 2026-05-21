import { execSync } from "child_process";
import fs from "fs";
import { mkdtempSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svgPath = path.join(__dirname, "../apps/web/public/icon.svg");
const outPath = path.join(__dirname, "../packages/backend/convex/mcp/icon.ts");
const pngSize = 128;

const tmpDir = mkdtempSync(path.join(os.tmpdir(), "eva-icon-"));
const tmpPng = path.join(tmpDir, "icon.png");

try {
  execSync(
    `npx --yes @resvg/resvg-js-cli "${svgPath}" "${tmpPng}" --fit-width ${pngSize} --fit-height ${pngSize}`,
    { stdio: "pipe" },
  );

  const pngBase64 = fs.readFileSync(tmpPng).toString("base64");

  const chunks = [];
  for (let i = 0; i < pngBase64.length; i += 76) {
    chunks.push(`  "${pngBase64.slice(i, i + 76)}"`);
  }

  const content = [
    "// Generated from apps/web/public/icon.svg for MCP clients and Claude connector favicon discovery.",
    'export const MCP_ICON_MIME_TYPE = "image/png";',
    `export const MCP_ICON_SIZES = ["${pngSize}x${pngSize}"];`,
    "const MCP_ICON_PNG_BASE64 =",
    `${chunks.join(" +\n")};`,
    "",
    "export const MCP_ICON_DATA_URI = `data:${MCP_ICON_MIME_TYPE};base64,${MCP_ICON_PNG_BASE64}`;",
    "",
    "/** Decodes the embedded PNG bytes for /favicon.ico and /favicon.png HTTP routes. */",
    "export function decodeMcpIconPng(): Uint8Array {",
    "  const binary = atob(MCP_ICON_PNG_BASE64);",
    "  const bytes = new Uint8Array(binary.length);",
    "  for (let i = 0; i < binary.length; i++) {",
    "    bytes[i] = binary.charCodeAt(i);",
    "  }",
    "  return bytes;",
    "}",
    "",
    "export function mcpFaviconResponse(): Response {",
    "  return new Response(decodeMcpIconPng(), {",
    "    headers: {",
    '      "Content-Type": "image/png",',
    '      "Cache-Control": "public, max-age=86400",',
    "    },",
    "  });",
    "}",
    "",
    "export function mcpSiteRootResponse(): Response {",
    "  return new Response(",
    '    `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="icon" href="/favicon.png" type="image/png" sizes="128x128"><link rel="icon" href="/favicon.ico" type="image/png"><title>Eva MCP</title></head><body></body></html>`,',
    "    {",
    "      headers: {",
    '        "Content-Type": "text/html; charset=utf-8",',
    '        "Cache-Control": "public, max-age=3600",',
    "      },",
    "    },",
    "  );",
    "}",
    "",
  ].join("\n");

  fs.writeFileSync(outPath, content);
  console.log(`Wrote ${outPath} (${content.length} bytes, PNG ${pngSize}x${pngSize})`);
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
