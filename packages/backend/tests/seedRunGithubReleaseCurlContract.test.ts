import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

/**
 * The seed-run command list with `//` comment lines stripped. Comments here
 * quote the curl flags and the old `curl -fsSL` form, so an assertion over
 * the raw text would match the prose rather than the command.
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

const githubReleaseCurl = (() => {
  const source = readFileSync(
    join(testsDir, "../convex/snapshotActions.ts"),
    "utf8",
  );
  const match = /const GITHUB_RELEASE_CURL =\s*"([^"]+)"/.exec(source);
  const value = match === null ? undefined : match[1];
  if (value === undefined) {
    throw new Error("GITHUB_RELEASE_CURL moved or was renamed");
  }
  return value;
})();

/**
 * A carepulse-ts web snapshot died at toolchain install with
 * `curl: (56) Connection died, tried 5 times` fetching the gh tarball over
 * HTTP/2. `--retry` does not cover that; HTTP/1.1 plus `--retry-all-errors`
 * does, matching the config-file chunk download fix.
 */
describe("seed run GitHub release downloads survive HTTP/2 drops", () => {
  test("the shared curl uses HTTP/1.1 and retries error 56", () => {
    expect(githubReleaseCurl).toContain("--http1.1");
    expect(githubReleaseCurl).toContain("--retry 5");
    expect(githubReleaseCurl).toContain("--retry-all-errors");
    expect(githubReleaseCurl).not.toContain("-fsSL");
  });

  test("every GitHub tarball install uses that curl", () => {
    const interpolations = seedRunCommands.match(
      /\$\{GITHUB_RELEASE_CURL\}/g,
    );
    expect(
      interpolations?.length,
      "supabase, gh, rg, fd, and git-lfs each interpolate GITHUB_RELEASE_CURL",
    ).toBe(5);
    expect(seedRunCommands).not.toMatch(/curl -fsSL https:\/\/github\.com/);
  });

  test("gh falls back to the official yum repo if the tarball fails", () => {
    const ghLine = [...seedRunCommands.matchAll(/^.*SEEDRUN-FAILED:gh-cli.*$/gm)]
      .map((match) => match[0])
      .at(0);
    if (ghLine === undefined) {
      throw new Error("the gh-cli failure marker moved");
    }
    expect(ghLine).toContain("${GITHUB_RELEASE_CURL}");
    expect(ghLine).toContain("cli.github.com/packages/rpm/gh-cli.repo");
    expect(ghLine).toContain("dnf install -y gh --repo gh-cli");
    expect(ghLine).toContain("exit 1");
  });
});
