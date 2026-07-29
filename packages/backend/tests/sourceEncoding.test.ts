import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Extensions whose contents are hand-written text, so control bytes are never meant. */
const TEXT_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".css",
  ".html",
  ".yml",
  ".yaml",
  ".sh",
  ".toml",
];

/**
 * A single NUL byte once landed inside a cache-key separator in FileViewerPanel
 * (fix 421578c4). Nothing complained: TypeScript compiled it, Prettier formatted
 * around it, tests passed — but git reclassified the file as binary, so it lost
 * diffs, blame, and review. The byte was invisible in every editor.
 *
 * Tabs, newlines and carriage returns are the only control bytes source files
 * legitimately contain.
 */
describe("tracked source files are plain text", () => {
  test("no source file contains a control byte", () => {
    const offenders: string[] = [];
    for (const path of trackedTextFiles()) {
      const bytes = readFileSync(join(repoRoot, path));
      const found = new Set<number>();
      for (const byte of bytes) {
        if (byte === 9 || byte === 10 || byte === 13) continue;
        if (byte < 32 || byte === 127) found.add(byte);
      }
      if (found.size > 0) {
        const codes = [...found]
          .map((byte) => `0x${byte.toString(16).padStart(2, "0")}`)
          .join(", ");
        offenders.push(`${path}: ${codes}`);
      }
    }
    expect(
      offenders,
      "delete the control bytes — they are never intentional",
    ).toEqual([]);
  });

  /** A broken file list would make the scan above pass by scanning nothing. */
  test("the scan actually sees the repo", () => {
    expect(trackedTextFiles().length).toBeGreaterThan(500);
  });
});

/**
 * Every text file git tracks. `git ls-files` rather than a directory walk: it
 * already excludes node_modules, build output and anything gitignored, and its
 * answer is exactly the set of files a stray byte would be committed into.
 */
function trackedTextFiles(): string[] {
  const listed = execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    maxBuffer: 1 << 28,
    encoding: "utf8",
  });
  return listed
    .split("\0")
    .filter(Boolean)
    .filter((path) => TEXT_EXTENSIONS.some((ext) => path.endsWith(ext)));
}
