import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

/**
 * The seed-run command list with `//` comment lines stripped. The comment above
 * the symlink quotes `/usr/bin/supabase`, so an assertion over the raw text
 * would match the prose rather than the command.
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

/** The single seed-run command carrying `SEEDRUN-FAILED:<marker>`. */
function commandFor(marker: string): string {
  const line = seedRunCommands
    .split("\n")
    .find((command) => command.includes(`SEEDRUN-FAILED:${marker}"`));
  if (line === undefined) {
    throw new Error(`the ${marker} failure marker moved or was renamed`);
  }
  return line;
}

/**
 * The toolchain untars the Supabase CLI into /usr/local/bin, but repo seed
 * scripts invoke it by the absolute path /usr/bin/supabase (to skip a
 * node_modules/.bin shim). That mismatch failed the carepulse-ts web snapshot
 * seed with `spawn /usr/bin/supabase ENOENT` — a failure that only surfaces
 * once a real repo seed runs, long after the toolchain step reports success.
 */
describe("seed run exposes the Supabase CLI on both install paths", () => {
  test("the CLI is symlinked to /usr/bin/supabase", () => {
    const symlink = commandFor("supabase-cli-symlink");
    expect(symlink).toContain("ln -sf");
    expect(symlink).toContain("/usr/bin/supabase");
  });

  test("the symlink target follows wherever the install landed", () => {
    // Hard-coding /usr/local/bin would silently dangle if the install moves.
    expect(commandFor("supabase-cli-symlink")).toContain(
      '"$(command -v supabase)"',
    );
  });

  test("the symlink is skipped when the sandbox already ships that path", () => {
    // Image-provided CLIs at /usr/bin/supabase must survive a seed rerun.
    expect(commandFor("supabase-cli-symlink")).toContain(
      "[ -e /usr/bin/supabase ] ||",
    );
  });

  test("the symlink runs after the install, and fails the run loudly", () => {
    const installAt = seedRunCommands.indexOf(commandFor("supabase-cli"));
    const symlinkAt = seedRunCommands.indexOf(
      commandFor("supabase-cli-symlink"),
    );
    expect(installAt).toBeGreaterThan(-1);
    expect(
      symlinkAt,
      "linking before the install resolves nothing",
    ).toBeGreaterThan(installAt);
    expect(commandFor("supabase-cli-symlink")).toContain("exit 1");
  });
});
