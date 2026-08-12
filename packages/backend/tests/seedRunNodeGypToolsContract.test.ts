import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

/**
 * The seed-run command list with `//` comment lines stripped.
 */
const seedRunCommands = (() => {
  const source = readFileSync(
    join(testsDir, "../convex/snapshotActions.ts"),
    "utf8",
  );
  const startAt = source.indexOf("export const launchSeedRun");
  expect(startAt, "launchSeedRun moved or was renamed").toBeGreaterThan(-1);
  const nextAt = source.indexOf("\nexport ", startAt + 1);
  return source
    .slice(startAt, nextAt < 0 ? undefined : nextAt)
    .replace(/^\s*\/\/.*$/gm, "");
})();

/**
 * A carepulse-ts web snapshot died at `SEEDRUN-FAILED:agent-clis` because
 * agentation-mcp's better-sqlite3 native addon could not compile: the
 * fresh Vercel node24 sandbox has no `make`/`gcc`. Those packages must
 * land in the toolchain dnf install, before the global npm install.
 */
describe("seed run installs node-gyp tools before agent CLIs", () => {
  test("toolchain dnf includes gcc, g++, and make", () => {
    const dnfLine = [
      ...seedRunCommands.matchAll(/^.*SEEDRUN-FAILED:toolchain-dnf.*$/gm),
    ]
      .map((match) => match[0])
      .at(0);
    if (dnfLine === undefined) {
      throw new Error("the toolchain-dnf failure marker moved");
    }
    expect(dnfLine).toContain(" gcc ");
    expect(dnfLine).toContain(" gcc-c++ ");
    expect(dnfLine).toMatch(/\bmake\b/);
  });

  test("those packages are installed before the agent-clis npm install", () => {
    const dnfAt = seedRunCommands.indexOf("SEEDRUN-FAILED:toolchain-dnf");
    const npmAt = seedRunCommands.indexOf("SEEDRUN-FAILED:agent-clis");
    expect(dnfAt).toBeGreaterThan(-1);
    expect(npmAt).toBeGreaterThan(-1);
    expect(dnfAt).toBeLessThan(npmAt);
    expect(seedRunCommands).toContain("agentation-mcp@");
  });
});
