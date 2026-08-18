import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { PACKAGE_HELPER_SCRIPT } from "../convex/_sandbox_runtime/packageManager";

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

/** `eva_pkg_install_ffmpeg`'s body, extracted from the shared bash helper. */
const ffmpegHelperBody = (() => {
  const startAt = PACKAGE_HELPER_SCRIPT.indexOf("eva_pkg_install_ffmpeg() {");
  expect(
    startAt,
    "eva_pkg_install_ffmpeg moved or was renamed",
  ).toBeGreaterThan(-1);
  const endAt = PACKAGE_HELPER_SCRIPT.indexOf("\n}", startAt);
  return PACKAGE_HELPER_SCRIPT.slice(startAt, endAt);
})();

/**
 * `agent-browser record` needs ffmpeg to encode the WebM. Older snapshots bake
 * the VNC stack but not ffmpeg, so an install that sits inside the desktop
 * health/install logic never runs — both the healthy early-return and the
 * `INSTALLED=1` guard bypass it — and those sandboxes can never record.
 * The install has to come before either gate.
 */
test("desktop start installs ffmpeg before the health gate and install guard", () => {
  const ffmpegAt = desktopStartBody.indexOf("eva_pkg_install_ffmpeg");
  expect(ffmpegAt, "desktop start must install ffmpeg").toBeGreaterThan(-1);

  const gates = [
    // Healthy stack → early return, skipping everything below.
    "if (healthy.exitCode === 0)",
    // Already-installed VNC stack → the package block is skipped.
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

/** Soft-failing, so a package-manager hiccup cannot block desktop startup. */
test("the ffmpeg install cannot block startup", () => {
  const installAt = desktopStartBody.indexOf("eva_pkg_install_ffmpeg");
  expect(
    desktopStartBody.slice(installAt, installAt + 60),
    "a failing install must not throw out of desktop startup",
  ).toContain("|| true");
});

/**
 * Idempotence lives in the helper: it returns early when ffmpeg already runs,
 * so calling it on every desktop start is a no-op on a warm sandbox.
 */
test("the health probe catches a present but unloadable ffmpeg binary", () => {
  expect(
    ffmpegHelperBody,
    "`command -v ffmpeg` calls SPAL's broken binary healthy — gate on running it",
  ).not.toContain("command -v ffmpeg");
  expect(ffmpegHelperBody).toContain(
    "ffmpeg -version >/dev/null 2>&1 && return 0",
  );
});

/**
 * dnf-only repair path: SPAL's ffmpeg links against libjack.so.0 without
 * depending on the package that ships it. Ubuntu's ffmpeg has no such problem,
 * so the repair must stay inside the dnf branch.
 */
test("the dnf repair installs ffmpeg before its missing libjack dependency", () => {
  const ffmpegInstallAt = ffmpegHelperBody.indexOf("ffmpeg-free");
  const libjackInstallAt = ffmpegHelperBody.indexOf("libjack.so.0");
  expect(ffmpegInstallAt).toBeGreaterThan(-1);
  expect(libjackInstallAt).toBeGreaterThan(ffmpegInstallAt);
  expect(
    ffmpegHelperBody.slice(libjackInstallAt, libjackInstallAt + 500),
  ).toContain("|| true");
});

/** Ubuntu managed images get plain `ffmpeg` — no SPAL repo, no libjack repair. */
test("the apt path installs ffmpeg directly", () => {
  const aptBranchAt = ffmpegHelperBody.indexOf('if [ "$mgr" = apt ]');
  const dnfBranchAt = ffmpegHelperBody.indexOf("  else");
  expect(aptBranchAt).toBeGreaterThan(-1);
  expect(dnfBranchAt).toBeGreaterThan(aptBranchAt);
  const aptBranch = ffmpegHelperBody.slice(aptBranchAt, dnfBranchAt);
  expect(aptBranch).toContain(
    "apt-get install -y --no-install-recommends ffmpeg",
  );
  expect(aptBranch, "SPAL is an AL2023 repo").not.toContain("spal-release");
  expect(aptBranch, "libjack is an AL2023-only defect").not.toContain(
    "libjack",
  );
});
