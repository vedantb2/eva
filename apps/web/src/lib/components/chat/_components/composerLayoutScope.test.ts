import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const rawSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "ComposerInputChrome.tsx"),
  "utf8",
).replaceAll("\r\n", "\n");

/** Comments there name the very API the assertions here rule out. */
const source = rawSource
  .replace(/\/\*\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

/**
 * Motion resolves `layoutId` globally unless a LayoutGroup namespaces it, and
 * several composers stay mounted at once (kept-alive session shells, Manager
 * Ave). Two sharing an id put one in the follower slot of the shared stack,
 * which hid its tools at opacity 0 and flung them at the hidden lead's 0x0
 * box — the pill rendered with no buttons at all.
 *
 * The same shape cost us the sandbox panel toggle (see
 * usePersistentPanelSize.test.ts): a globally-resolved id that the visible
 * instance and a hidden one both answer to. Nothing about it fails to compile
 * and it only reproduces with two composers mounted, so it is pinned here.
 */
describe("the composer's shared layout ids are scoped per instance", () => {
  test("the LayoutGroup is namespaced by a per-mount id", () => {
    expect(source).toContain("useId()");
    expect(source).toMatch(/<LayoutGroup id=\{[A-Za-z][A-Za-z0-9]*\}>/);
    expect(source).not.toContain("<LayoutGroup>");
  });
});
