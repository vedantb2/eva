import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const vercelProviderSource = readFileSync(
  join(testsDir, "../convex/_sandbox/vercelProvider.ts"),
  "utf8",
);

/**
 * `VercelDesktop.start`'s body with `//` comments stripped — the prose there
 * mentions the very gates these tests order against, so an ordering assertion
 * run over the raw text matches the comment instead of the code.
 */
const desktopStartBody = (() => {
  const classAt = vercelProviderSource.indexOf("class VercelDesktop");
  expect(classAt, "VercelDesktop moved or was renamed").toBeGreaterThan(-1);
  const startAt = vercelProviderSource.indexOf("async start()", classAt);
  expect(startAt).toBeGreaterThan(-1);
  const nextMethodAt = vercelProviderSource.indexOf("\n  async ", startAt + 1);
  return vercelProviderSource
    .slice(startAt, nextMethodAt < 0 ? undefined : nextMethodAt)
    .replace(/^\s*\/\/.*$/gm, "");
})();

/**
 * `agent-browser record` needs ffmpeg to encode the WebM. Older snapshots bake
 * the VNC stack but not ffmpeg, so an install that sits inside the desktop
 * health/install logic never runs — both the healthy early-return and the
 * `INSTALLED=1` guard bypass it — and those sandboxes can never record.
 * The install has to come before either gate.
 */
test("desktop start installs ffmpeg before the health gate and install guard", () => {
  const ffmpegAt = desktopStartBody.indexOf("command -v ffmpeg");
  expect(ffmpegAt, "desktop start must install ffmpeg").toBeGreaterThan(-1);

  const gates = [
    // Healthy stack → early return, skipping everything below.
    "if (healthy.exitCode === 0)",
    // Already-installed VNC stack → the dnf block is skipped.
    'if [ "$INSTALLED" != "1" ]; then',
  ];
  for (const gate of gates) {
    const gateAt = desktopStartBody.indexOf(gate);
    expect(gateAt, `gate moved: ${gate}`).toBeGreaterThan(-1);
    expect(
      ffmpegAt,
      `ffmpeg install must precede \`${gate}\` or older snapshots skip it forever`,
    ).toBeLessThan(gateAt);
  }
});

/** Soft-failing and idempotent, so a dnf hiccup cannot block desktop startup. */
test("the ffmpeg install is idempotent and cannot block startup", () => {
  const installAt = desktopStartBody.indexOf("if ! command -v ffmpeg");
  expect(
    installAt,
    "the install must be gated on `command -v` so re-running is a no-op",
  ).toBeGreaterThan(-1);
  const installBlock = desktopStartBody.slice(installAt, installAt + 600);
  expect(
    installBlock,
    "a failing dnf must not throw out of desktop startup",
  ).toContain("|| true");
});
