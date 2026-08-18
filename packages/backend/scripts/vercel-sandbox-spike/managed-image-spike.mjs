// @ts-check
/**
 * Phase 1 spike — Vercel Managed Images (Ubuntu) migration go/no-go.
 *
 * WHY: eva creates sandboxes with `runtime: "node24"` (Amazon Linux 2023), and
 * its seed pipeline carries AL2023-specific workarounds (gh release tarball,
 * ffmpeg via `spal-release`, libjack shims, a google-chrome yum repo). SDK v3
 * replaces `runtime` with `image` and the managed `vercel/sandbox/universal`
 * image is Ubuntu 26.04 with most of that toolchain preshipped. Migrating is a
 * seed-time/maintenance win — but only if the container user, working
 * directory, snapshot round-trip and *existing AL2023 snapshots* all survive.
 *
 * This script answers, against live infrastructure, the seven checks and three
 * open questions in the migration plan:
 *
 *   1. boot time, managed image vs the `runtime: "node24"` baseline
 *   2. identity + working directory (`whoami`, `$HOME`, `/vercel/sandbox`)
 *   3. snapshot round-trip on the managed image
 *   4. LEGACY: create from an AL2023 snapshot using SDK v3   <- migration blocker
 *   5. `apt-get install` of eva's toolchain; what is already preinstalled
 *   6. IPv4-only networking (eva's sandboxes have no IPv6)
 *   7. `ports` + per-port public URL behaviour
 *   Q1 preinstalled coding agents vs eva's own CLI installs
 *   Q3 `runCommand` semantics eva relies on (sudo, detached + re-attach, env)
 *
 * Standalone — imports neither Convex nor the eva backend. See README.md.
 * Output: prints tables and writes `managed-image-results.json`.
 *
 * Coded against @vercel/sandbox v3.0.0.
 */

import { writeFile } from "node:fs/promises";
import { Sandbox } from "@vercel/sandbox";

// ---------------------------------------------------------------------------
// Config (all from env — never hard-code tokens)
// ---------------------------------------------------------------------------

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}. See README.md.`);
    process.exit(1);
  }
  return v;
}

/** Credentials object the SDK accepts on every static call. */
const CREDS = {
  token: requireEnv("VERCEL_TOKEN"),
  teamId: requireEnv("VERCEL_TEAM_ID"),
  projectId: requireEnv("VERCEL_PROJECT_ID"),
};

const CONFIG = {
  /** Managed image under test. `:latest` here; prod would pin a version tag. */
  image: process.env.SPIKE_IMAGE ?? "vercel/sandbox/universal:latest",
  /** The runtime eva ships today — the baseline every measurement compares to. */
  legacyRuntime: process.env.SPIKE_LEGACY_RUNTIME ?? "node24",
  /**
   * Optional: an existing *prod* AL2023 snapshot id. Check 4 always tests a
   * snapshot this script creates itself; pass one to also prove a real eva
   * seeded snapshot still restores under v3.
   */
  legacySnapshotId: process.env.SPIKE_LEGACY_SNAPSHOT_ID ?? null,
  vcpus: Number(process.env.SPIKE_VCPUS ?? "4"),
  /** Skip the ~minutes-long apt stage (checks 1-4, 6-7 still run). */
  skipApt: process.env.SPIKE_SKIP_APT === "1",
  httpPort: 3000,
};

/** eva hardcodes this as the sandbox working dir in several places. */
const EVA_LEGACY_WORKDIR = "/vercel/sandbox";
/** eva clones every repo here (WORKSPACE_DIR in _sandbox_runtime/helpers.ts). */
const EVA_WORKSPACE_DIR = "/tmp/repo";
/** Absolute so it is independent of whatever the default cwd turns out to be. */
const MARKER_PATH = "/tmp/eva-managed-image-spike.marker";

/** Sandboxes created by this run, stopped in `main`'s finally block. */
const created = [];

// ---------------------------------------------------------------------------
// Thin SDK wrappers — one place to adjust if the SDK shifts.
// ---------------------------------------------------------------------------

/**
 * Creates a sandbox. Exactly one of `image` / `runtime` / `snapshotId` applies;
 * the v3 types make all three mutually exclusive (`RuntimeOrImage`, and the
 * snapshot `source` variant forbids both).
 */
async function createSandbox({ image, runtime, snapshotId, timeoutMs } = {}) {
  /** @type {Record<string, unknown>} */
  const params = {
    ...CREDS,
    timeout: timeoutMs ?? 20 * 60 * 1000,
    ports: [CONFIG.httpPort],
    resources: { vcpus: CONFIG.vcpus },
    // Tag so cleanup.mjs targets only tooling-created sandboxes.
    tags: { managedBy: "eva-migration-tooling" },
  };
  if (snapshotId) params.source = { type: "snapshot", snapshotId };
  else if (image) params.image = image;
  else params.runtime = runtime ?? CONFIG.legacyRuntime;

  const sandbox = await Sandbox.create(params);
  created.push(sandbox);
  return sandbox;
}

/**
 * Runs a command through a login shell and returns exit code + output without
 * throwing. Probing is the whole point here: a non-zero exit is data, not an
 * error. `cwd` is deliberately omitted by default so we observe the image's
 * own default working directory.
 */
async function probe(sandbox, cmd, { cwd, sudo = false, timeoutMs } = {}) {
  try {
    const finished = await sandbox.runCommand({
      cmd: "bash",
      args: ["-lc", cmd],
      ...(cwd ? { cwd } : {}),
      sudo,
      ...(timeoutMs ? { timeoutMs } : {}),
    });
    const stdout = (await finished.stdout().catch(() => "")).trim();
    const stderr = (await finished.stderr().catch(() => "")).trim();
    return { exitCode: finished.exitCode, stdout, stderr };
  } catch (e) {
    return { exitCode: -1, stdout: "", stderr: String(e).split("\n")[0] };
  }
}

/** stdout of a probe, or a marker string when the command failed. */
async function value(sandbox, cmd, opts) {
  const r = await probe(sandbox, cmd, opts);
  return r.exitCode === 0 && r.stdout ? r.stdout : `<failed:${r.exitCode}>`;
}

async function timed(label, fn) {
  const start = Date.now();
  const result = await fn();
  const ms = Date.now() - start;
  console.log(`  ⏱  ${label}: ${(ms / 1000).toFixed(2)}s`);
  return { ms, value: result };
}

// ---------------------------------------------------------------------------
// [1] + [2] Boot time, identity, working directory
// ---------------------------------------------------------------------------

/**
 * Creates one sandbox of the given flavour and records boot timings plus the
 * environment facts eva's hardcoded paths depend on.
 */
async function bootAndInspect(label, createOpts) {
  console.log(`\n[1/2] ${label}: boot + identity…`);
  const { ms: createMs, value: sandbox } = await timed(`create (${label})`, () =>
    createSandbox(createOpts),
  );
  // First exec absorbs the boot penalty; eva's create path measures the same
  // thing when it writes EVA_ENV_FILE as its first sandbox I/O.
  const { ms: firstExecMs } = await timed(`first exec (${label})`, () =>
    probe(sandbox, "true"),
  );

  const identity = {
    whoami: await value(sandbox, "whoami"),
    home: await value(sandbox, 'echo "$HOME"'),
    // The default cwd of an exec with no explicit `cwd` — what eva gets when a
    // call omits it.
    defaultPwd: await value(sandbox, "pwd"),
    // The SDK's own view of the session working directory.
    sdkCwd: sandbox.cwd,
    sdkImage: sandbox.image ?? null,
    sdkRuntime: sandbox.runtime ?? null,
    osRelease: await value(
      sandbox,
      'grep PRETTY_NAME /etc/os-release | cut -d= -f2- | tr -d \'"\'',
    ),
    kernel: await value(sandbox, "uname -r"),
    legacyWorkdirExists:
      (await probe(sandbox, `test -d ${EVA_LEGACY_WORKDIR}`)).exitCode === 0,
    legacyWorkdirWritable:
      (await probe(sandbox, `test -w ${EVA_LEGACY_WORKDIR}`)).exitCode === 0,
    // eva pre-creates /tmp/repo on fresh sandboxes; confirm mkDir still works.
    workspaceMkdirOk: await (async () => {
      try {
        await sandbox.mkDir(EVA_WORKSPACE_DIR);
        return (await probe(sandbox, `test -d ${EVA_WORKSPACE_DIR}`)).exitCode === 0;
      } catch (e) {
        return String(e).split("\n")[0];
      }
    })(),
    passwordlessSudo: (await probe(sandbox, "sudo -n true")).exitCode === 0,
  };
  console.table(identity);
  return { sandbox, timings: { createMs, firstExecMs }, identity };
}

// ---------------------------------------------------------------------------
// [5] + Q1 Toolchain inventory and apt install
// ---------------------------------------------------------------------------

/** Binaries eva's seed pipeline and callback bundle expect on PATH. */
const EXPECTED_BINARIES = [
  "node",
  "npm",
  "pnpm",
  "bun",
  "git",
  "git-lfs",
  "jq",
  "gh",
  "python3",
  "pip3",
  "gcc",
  "g++",
  "make",
  "docker",
  "dockerd",
  "ffmpeg",
  "Xvnc",
  "vncserver",
  "xterm",
  "google-chrome-stable",
  "chromium",
  "vim",
  "curl",
  "tar",
  "gzip",
];

/** Coding-agent CLIs the universal image advertises (open question Q1). */
const AGENT_BINARIES = ["claude", "codex", "cursor-agent", "gemini", "opencode", "amp"];

/**
 * eva's AL2023 seed packages, translated to Ubuntu names. Grouped so a single
 * bad package name doesn't hide the rest — a failed group is retried
 * package-by-package to name the exact culprit for the Phase 2 seed rewrite.
 */
const APT_GROUPS = {
  // AL2023: docker git jq gzip tar procps-ng psmisc
  core: ["docker.io", "git", "git-lfs", "jq", "gzip", "tar", "procps", "psmisc"],
  // AL2023: gcc gcc-c++ make (node-gyp → better-sqlite3 rebuilds)
  build: ["build-essential"],
  // AL2023: tigervnc-server python3 python3-pip xorg-x11-utils xterm dbus-x11
  desktop: [
    "tigervnc-standalone-server",
    "tigervnc-common",
    "python3",
    "python3-pip",
    "x11-utils",
    "xterm",
    "dbus-x11",
  ],
  // AL2023 needed spal-release + ffmpeg-free + libjack shims for this one line.
  ffmpeg: ["ffmpeg"],
  // AL2023: gtk3 nss alsa-lib libXtst at-spi2-core libdrm mesa-libgbm
  // libxkbcommon libXdamage libXcomposite libXrandr libXcursor libXinerama
  // cups-libs. Chrome/agent-browser GUI deps; names drift between releases
  // (libasound2 → libasound2t64), which is exactly what we want to find out.
  gui: [
    "libgtk-3-0",
    "libnss3",
    "libasound2t64",
    "libxtst6",
    "libatspi2.0-0",
    "libdrm2",
    "libgbm1",
    "libxkbcommon0",
    "libxdamage1",
    "libxcomposite1",
    "libxrandr2",
    "libxcursor1",
    "libxinerama1",
    "libcups2",
  ],
  // AL2023 installed this from a pinned GitHub release tarball.
  gh: ["gh"],
};

async function inventory(sandbox, binaries) {
  /** @type {Record<string, string>} */
  const found = {};
  for (const bin of binaries) {
    const r = await probe(
      sandbox,
      `command -v ${bin} >/dev/null 2>&1 && { ${bin} --version 2>&1 | head -1; } || echo MISSING`,
    );
    found[bin] = r.stdout || `<exit ${r.exitCode}>`;
  }
  return found;
}

/** Installs each APT_GROUPS entry, timing it and isolating failures. */
async function aptInstall(sandbox) {
  console.log("\n[5] apt-get: eva toolchain on the managed image…");
  const update = await timed("apt-get update", () =>
    probe(sandbox, "sudo apt-get update -qq", { sudo: true, timeoutMs: 5 * 60 * 1000 }),
  );
  /** @type {Record<string, unknown>} */
  const results = { update: { ms: update.ms, exitCode: update.value.exitCode } };

  for (const [group, pkgs] of Object.entries(APT_GROUPS)) {
    const { ms, value: r } = await timed(`install ${group} (${pkgs.length} pkgs)`, () =>
      probe(sandbox, `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ${pkgs.join(" ")}`, {
        sudo: true,
        timeoutMs: 10 * 60 * 1000,
      }),
    );
    if (r.exitCode === 0) {
      results[group] = { ms, ok: true, packages: pkgs };
      continue;
    }
    // Group failed — find which package names are wrong on this release.
    const perPackage = {};
    for (const pkg of pkgs) {
      const one = await probe(
        sandbox,
        `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ${pkg}`,
        { sudo: true, timeoutMs: 5 * 60 * 1000 },
      );
      perPackage[pkg] = one.exitCode === 0 ? "ok" : (one.stderr || one.stdout).slice(0, 200);
    }
    results[group] = { ms, ok: false, error: (r.stderr || r.stdout).slice(0, 400), perPackage };
    console.log(`  ⚠  ${group} group failed; per-package: ${JSON.stringify(perPackage)}`);
  }

  // Chrome is the one seed step with no plain apt equivalent (AL2023 used a
  // google-chrome yum repo). Test the Google apt repo the same way, because
  // Ubuntu's own `chromium` package is a snap shim and snapd won't run here.
  const chrome = await timed("install google-chrome-stable (Google apt repo)", () =>
    probe(
      sandbox,
      [
        "set -e",
        "curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg",
        `echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list >/dev/null`,
        "sudo apt-get update -qq",
        "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq google-chrome-stable",
        "google-chrome-stable --version",
      ].join("\n"),
      { sudo: true, timeoutMs: 10 * 60 * 1000 },
    ),
  );
  results.chrome = {
    ms: chrome.ms,
    ok: chrome.value.exitCode === 0,
    detail: (chrome.value.stdout || chrome.value.stderr).slice(0, 300),
  };

  // The two AL2023 hacks the migration wants to delete — verify the plain
  // packages actually produce working binaries, not just install cleanly.
  results.postInstallGates = {
    ffmpegRuns: (await probe(sandbox, "ffmpeg -version")).exitCode === 0,
    ffmpegWebm:
      (await probe(sandbox, "ffmpeg -hide_banner -encoders 2>/dev/null | grep -q vp8")).exitCode ===
      0,
    ghRuns: (await probe(sandbox, "gh --version")).exitCode === 0,
    dockerdPresent: (await probe(sandbox, "command -v dockerd")).exitCode === 0,
    vncPresent: (await probe(sandbox, "command -v Xvnc || command -v vncserver")).exitCode === 0,
  };
  console.table(results.postInstallGates);
  return results;
}

// ---------------------------------------------------------------------------
// [3] + [4] Snapshot round-trip and legacy AL2023 compatibility
// ---------------------------------------------------------------------------

/** Writes a marker, snapshots, restores, and reads the marker back. */
async function snapshotRoundTrip(label, sandbox, restoreOpts = {}) {
  console.log(`\n[3] ${label}: snapshot round-trip…`);
  await probe(sandbox, `echo ${label} > ${MARKER_PATH}`);
  const { ms: snapMs, value: snap } = await timed(`snapshot (${label})`, () =>
    sandbox.snapshot({ expiration: 0 }),
  );
  console.log(
    `  📦 ${snap.snapshotId} — ${(snap.sizeBytes / 1e9).toFixed(2)}GB status=${snap.status}`,
  );

  const { ms: restoreMs, value: restored } = await timed(`restore (${label})`, () =>
    createSandbox({ snapshotId: snap.snapshotId, ...restoreOpts }),
  );
  const markerBack = await value(restored, `cat ${MARKER_PATH}`);
  const result = {
    snapshotId: snap.snapshotId,
    snapshotMs: snapMs,
    snapshotSizeBytes: snap.sizeBytes,
    restoreMs,
    markerSurvived: markerBack === label,
    marker: markerBack,
    // Identity after restore: a snapshot must not silently change user/cwd.
    whoami: await value(restored, "whoami"),
    defaultPwd: await value(restored, "pwd"),
    sdkCwd: restored.cwd,
    osRelease: await value(
      restored,
      'grep PRETTY_NAME /etc/os-release | cut -d= -f2- | tr -d \'"\'',
    ),
  };
  console.table(result);
  return { result, restored };
}

/**
 * Check 4 — the migration blocker. eva's prod snapshots are all AL2023; if SDK
 * v3 cannot restore them, migration means re-seeding every repo rather than a
 * library bump.
 */
async function legacySnapshotCompat(legacySandbox) {
  console.log("\n[4] LEGACY AL2023 snapshot → SDK v3 restore…");
  const { result } = await snapshotRoundTrip("al2023", legacySandbox);

  /** @type {Record<string, unknown>} */
  const out = { selfCreated: result };
  if (CONFIG.legacySnapshotId) {
    console.log(`  restoring supplied prod snapshot ${CONFIG.legacySnapshotId}…`);
    try {
      const { ms, value: restored } = await timed("restore prod AL2023 snapshot", () =>
        createSandbox({ snapshotId: CONFIG.legacySnapshotId }),
      );
      out.prodSnapshot = {
        snapshotId: CONFIG.legacySnapshotId,
        restoreMs: ms,
        ok: true,
        whoami: await value(restored, "whoami"),
        defaultPwd: await value(restored, "pwd"),
        osRelease: await value(
          restored,
          'grep PRETTY_NAME /etc/os-release | cut -d= -f2- | tr -d \'"\'',
        ),
        repoPresent: (await probe(restored, `test -d ${EVA_WORKSPACE_DIR}/.git`)).exitCode === 0,
      };
    } catch (e) {
      out.prodSnapshot = { snapshotId: CONFIG.legacySnapshotId, ok: false, error: String(e).split("\n")[0] };
    }
    console.table(out.prodSnapshot);
  } else {
    out.prodSnapshot = "skipped (set SPIKE_LEGACY_SNAPSHOT_ID to test a real eva seeded snapshot)";
  }
  return out;
}

// ---------------------------------------------------------------------------
// [6] Networking — eva's sandboxes are IPv4-only
// ---------------------------------------------------------------------------

async function networkProbes(sandbox) {
  console.log("\n[6] networking (IPv4-only expectation)…");
  const net = {
    ipv4Egress: (await probe(sandbox, "curl -4 -fsS -m 20 https://api.github.com/zen")).exitCode === 0,
    ipv6Egress: (await probe(sandbox, "curl -6 -fsS -m 10 https://api.github.com/zen")).exitCode === 0,
    globalIpv6Addrs: await value(
      sandbox,
      "ip -6 addr show scope global 2>/dev/null | grep -c inet6 || echo 0",
    ),
    dnsOk: (await probe(sandbox, "getent hosts registry.npmjs.org")).exitCode === 0,
    // Ubuntu images sometimes prefer IPv6 in getaddrinfo; if AAAA is tried
    // first and there is no IPv6 route, every fetch eats a connect timeout.
    gaiPrefersV4:
      (await probe(sandbox, "getent ahosts registry.npmjs.org | head -1 | grep -qv ':'")).exitCode ===
      0,
  };
  console.table(net);
  return net;
}

// ---------------------------------------------------------------------------
// [7] + Q3 Ports / public URL, and exec semantics eva depends on
// ---------------------------------------------------------------------------

async function portAndExecProbes(sandbox) {
  console.log("\n[7] ports / public URL + exec semantics…");
  const server = `require('http').createServer((_,r)=>r.end('eva-ok')).listen(${CONFIG.httpPort},'0.0.0.0');`;
  await sandbox.writeFiles([{ path: "/tmp/server.cjs", content: server }]);

  // Detached start — eva's callback agent runner and dev servers rely on this.
  let cmdId = null;
  let detachedError = null;
  try {
    const cmd = await sandbox.runCommand({
      cmd: "bash",
      args: ["-lc", `node /tmp/server.cjs`],
      detached: true,
    });
    cmdId = cmd.cmdId;
  } catch (e) {
    detachedError = String(e).split("\n")[0];
  }

  const url = sandbox.domain(CONFIG.httpPort);
  let httpOk = false;
  let httpDetail = "";
  for (let i = 0; i < 15 && !httpOk; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      httpDetail = `${res.status} ${(await res.text()).slice(0, 20)}`;
      httpOk = res.ok;
    } catch (e) {
      httpDetail = String(e).split("\n")[0];
    }
  }

  // Re-attach to the detached command (eva polls a detached runner this way).
  let reattachOk = false;
  if (cmdId) {
    try {
      reattachOk = Boolean(await sandbox.getCommand(cmdId));
    } catch (e) {
      detachedError = String(e).split("\n")[0];
    }
  }

  const exec = {
    portUrl: url,
    httpOk,
    httpDetail,
    detachedStarted: Boolean(cmdId),
    detachedReattachOk: reattachOk,
    detachedError,
    // eva passes `sudo: true` and per-command env on many calls.
    sudoFlagOk: (await probe(sandbox, "id -u", { sudo: true })).stdout === "0",
    perCommandEnvOk: await (async () => {
      const r = await sandbox.runCommand({
        cmd: "bash",
        args: ["-lc", 'echo "$EVA_PROBE"'],
        env: { EVA_PROBE: "set" },
      });
      return (await r.stdout().catch(() => "")).trim() === "set";
    })(),
    // eva writes its env file here and several modules hardcode the path.
    evaEnvFileWritable: await (async () => {
      try {
        await sandbox.writeFiles([
          { path: `${EVA_LEGACY_WORKDIR}/.eva-env.sh`, content: "export EVA_PROBE=1\n" },
        ]);
        return (await probe(sandbox, `test -f ${EVA_LEGACY_WORKDIR}/.eva-env.sh`)).exitCode === 0;
      } catch (e) {
        return String(e).split("\n")[0];
      }
    })(),
    // writeFiles with a relative path — the SDK docs say it lands in
    // /vercel/sandbox; confirm that still holds on the managed image.
    relativeWriteLandsIn: await (async () => {
      try {
        await sandbox.writeFiles([{ path: "eva-relative-probe.txt", content: "x" }]);
        return await value(
          sandbox,
          "ls /vercel/sandbox/eva-relative-probe.txt 2>/dev/null || find / -maxdepth 4 -name eva-relative-probe.txt 2>/dev/null | head -1",
        );
      } catch (e) {
        return String(e).split("\n")[0];
      }
    })(),
  };
  console.table(exec);
  return exec;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Vercel Managed Images (Phase 1) spike ===");
  console.log(
    `image=${CONFIG.image} baseline=runtime:${CONFIG.legacyRuntime} vcpus=${CONFIG.vcpus} skipApt=${CONFIG.skipApt}`,
  );

  // [1][2] Baseline (what eva ships today) then the managed image.
  const legacy = await bootAndInspect(`runtime:${CONFIG.legacyRuntime}`, {
    runtime: CONFIG.legacyRuntime,
  });
  const managed = await bootAndInspect(`image:${CONFIG.image}`, { image: CONFIG.image });

  // [5][Q1] What the universal image preships vs what eva must still install.
  const preinstalled = await inventory(managed.sandbox, EXPECTED_BINARIES);
  console.log("\n[Q1] preinstalled binaries:");
  console.table(preinstalled);
  const agents = await inventory(managed.sandbox, AGENT_BINARIES);
  console.log("[Q1] preinstalled coding agents (conflict risk with eva's own CLI installs):");
  console.table(agents);
  const agentPaths = {
    npmPrefix: await value(managed.sandbox, "npm prefix -g"),
    npmRootG: await value(managed.sandbox, "npm root -g"),
    nodePath: await value(managed.sandbox, "command -v node"),
    usrLocalBinWritable:
      (await probe(managed.sandbox, "test -w /usr/local/bin")).exitCode === 0,
  };
  console.table(agentPaths);

  const apt = CONFIG.skipApt ? "skipped (SPIKE_SKIP_APT=1)" : await aptInstall(managed.sandbox);
  const postApt = CONFIG.skipApt ? null : await inventory(managed.sandbox, EXPECTED_BINARIES);

  // [6][7][Q3] Probe on the managed sandbox (post-apt, so docker/ffmpeg exist).
  const net = await networkProbes(managed.sandbox);
  const exec = await portAndExecProbes(managed.sandbox);

  // [3] Ubuntu snapshot round-trip, then [4] the AL2023 compat blocker.
  const ubuntuSnapshot = await snapshotRoundTrip("ubuntu", managed.sandbox);
  const legacyCompat = await legacySnapshotCompat(legacy.sandbox);

  const results = {
    generatedAt: process.env.SPIKE_RUN_TS ?? null,
    sdkVersion: "3.0.0",
    config: CONFIG,
    boot: {
      legacy: { ...legacy.timings, identity: legacy.identity },
      managed: { ...managed.timings, identity: managed.identity },
    },
    toolchain: { preinstalled, postApt, agents, agentPaths, apt },
    network: net,
    exec,
    snapshots: { ubuntu: ubuntuSnapshot.result, legacy: legacyCompat },
    // Go/no-go against the plan's Phase 1 checklist. Items 2 and 4 are the
    // ones that decide migration size; the rest size the seed rewrite.
    verdict: {
      bootNoSlower: managed.timings.createMs <= legacy.timings.createMs * 1.5,
      userIsUbuntu: managed.identity.whoami === "ubuntu",
      legacyWorkdirStillExists: managed.identity.legacyWorkdirExists,
      workspaceMkdirOk: managed.identity.workspaceMkdirOk === true,
      ubuntuSnapshotRoundTrip: ubuntuSnapshot.result.markerSurvived,
      legacyAl2023SnapshotRestores: legacyCompat.selfCreated.markerSurvived,
      ipv4EgressOk: net.ipv4Egress,
      portUrlOk: exec.httpOk,
      detachedReattachOk: exec.detachedReattachOk,
      sudoFlagOk: exec.sudoFlagOk,
      ffmpegWithoutHacks: CONFIG.skipApt ? null : apt.postInstallGates?.ffmpegRuns === true,
      ghWithoutTarball: CONFIG.skipApt ? null : apt.postInstallGates?.ghRuns === true,
    },
  };

  await writeFile("managed-image-results.json", JSON.stringify(results, null, 2));
  console.log("\n=== Verdict ===");
  console.table(results.verdict);
  console.log("Full results in managed-image-results.json");
}

main()
  .catch((err) => {
    console.error("\nSPIKE FAILED:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Sandboxes bill while running; stop everything this run created.
    for (const sandbox of created) {
      await sandbox.stop().catch(() => {});
    }
    console.log(`\nstopped ${created.length} sandbox(es). Run cleanup.mjs to delete snapshots.`);
  });
