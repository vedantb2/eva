// @ts-check
/**
 * Phase 0 spike — Daytona -> Vercel Sandbox migration go/no-go benchmark.
 *
 * WHY: today, creating a Daytona sandbox from a heavy seeded snapshot (whole
 * codebase + node_modules + local DB state, ~10GB) takes minutes; archived
 * thaw takes 10-40 min. The migration's whole premise is that Vercel Sandbox
 * restores a snapshot in *seconds*. This measures that before we commit to
 * rewriting the ~17 Daytona integration files.
 *
 * It also probes the capabilities eva's sandbox layer depends on that Vercel
 * doesn't clearly document:
 *   - inbound WebSocket through a per-port public URL (preview proxy + local
 *     Convex `/__convex` routing need this),
 *   - native interactive PTY (openInteractive) as a createPty replacement,
 *   - detached long-running process + re-attach (our callback agent runner),
 *   - Docker-in-sandbox surviving restore (seeded Supabase).
 *
 * Deterministic heavy state: rather than a flaky clone+install, we write N GB
 * of *incompressible* filler (/dev/urandom) plus a seeded Postgres. That makes
 * "does restore latency scale with snapshot size" a controlled measurement.
 *
 * Standalone — imports neither Convex nor the eva backend. See README.md.
 * Output: prints a table and writes `spike-results.json`.
 *
 * Coded against @vercel/sandbox v2.4.x (types verified against the installed
 * package). Credentials are passed explicitly per call, never written to disk.
 */

import { writeFile } from "node:fs/promises";
import { Sandbox } from "@vercel/sandbox";
// Node 20 has no global WebSocket; use the `ws` client for the port-URL probe.
import WebSocket from "ws";

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
  runtime: process.env.SPIKE_RUNTIME ?? "node24",
  vcpus: Number(process.env.SPIKE_VCPUS ?? "4"),
  // GB of incompressible filler baked into the snapshot to stress restore-by-size.
  bulkGb: Number(process.env.SPIKE_BULK_GB ?? "2"),
  // Warm-restore repetitions (run #1 is treated as the cold-cache sample).
  warmRestoreRuns: Number(process.env.SPIKE_WARM_RUNS ?? "5"),
  devPort: 3000,
  wsPort: 3001,
};

const WORKDIR = "/vercel/sandbox";

// ---------------------------------------------------------------------------
// Thin SDK wrappers — one place to adjust if the SDK shifts.
// ---------------------------------------------------------------------------

/**
 * Creates a sandbox. Pass `snapshotId` to restore (in which case `runtime` must
 * be omitted — the SDK types forbid runtime+snapshot together).
 */
async function createSandbox({ snapshotId, timeoutMs } = {}) {
  /** @type {Record<string, unknown>} */
  const params = {
    ...CREDS,
    timeout: timeoutMs ?? 15 * 60 * 1000,
    ports: [CONFIG.devPort, CONFIG.wsPort],
    resources: { vcpus: CONFIG.vcpus },
  };
  if (snapshotId) {
    params.source = { type: "snapshot", snapshotId };
  } else {
    params.runtime = CONFIG.runtime;
  }
  return await Sandbox.create(params);
}

/** Runs a command to completion via a login shell; throws on non-zero exit. */
async function run(sandbox, cmd, { cwd = WORKDIR, sudo = false, timeoutMs } = {}) {
  const finished = await sandbox.runCommand({
    cmd: "bash",
    args: ["-lc", cmd],
    cwd,
    sudo,
    ...(timeoutMs ? { timeoutMs } : {}),
  });
  if (finished.exitCode !== 0) {
    const err = await finished.output("both").catch(() => "");
    throw new Error(`command failed (exit ${finished.exitCode}): ${cmd}\n${err}`);
  }
  return await finished.stdout().catch(() => "");
}

/** Starts a detached long-running command; returns its command id for re-attach. */
async function runDetached(sandbox, cmd, { cwd = WORKDIR } = {}) {
  const command = await sandbox.runCommand({
    cmd: "bash",
    args: ["-lc", cmd],
    cwd,
    detached: true,
  });
  return command.cmdId;
}

// ---------------------------------------------------------------------------
// Timing helper
// ---------------------------------------------------------------------------

async function timed(label, fn) {
  const start = Date.now();
  const value = await fn();
  const ms = Date.now() - start;
  console.log(`  ⏱  ${label}: ${(ms / 1000).toFixed(2)}s`);
  return { ms, value };
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

/** Builds a heavy base sandbox (bulk filler + seeded Postgres) and snapshots it. */
async function buildBaseSnapshot() {
  console.log(`\n[1] Building base sandbox (${CONFIG.bulkGb}GB filler + seed)…`);
  const { value: sandbox } = await timed("create fresh sandbox", () =>
    createSandbox({ timeoutMs: 20 * 60 * 1000 }),
  );

  // Incompressible filler split into 256MB files (mirrors node_modules bulk;
  // urandom defeats snapshot compression so size stress is honest).
  const chunks = Math.max(1, Math.round(CONFIG.bulkGb * 4)); // 256MB * 4 = 1GB
  await timed(`write ${CONFIG.bulkGb}GB filler`, () =>
    run(
      sandbox,
      `mkdir -p ${WORKDIR}/bulk && for i in $(seq 1 ${chunks}); do dd if=/dev/urandom of=${WORKDIR}/bulk/f$i bs=1M count=256 status=none; done`,
      { timeoutMs: 10 * 60 * 1000 },
    ),
  );

  await timed("start docker + seed postgres (best-effort)", () => seedBestEffort(sandbox));

  const diskUsage = (
    await run(sandbox, `du -sh ${WORKDIR} 2>/dev/null | cut -f1 || echo unknown`).catch(
      () => "unknown",
    )
  ).trim();
  console.log(`  📦 sandbox disk usage: ${diskUsage}`);

  const { ms: snapMs, value: snap } = await timed("snapshot()", () =>
    sandbox.snapshot({ expiration: 0 }),
  );
  console.log(`  ✅ snapshot ${snap.snapshotId} — ${(snap.sizeBytes / 1e9).toFixed(2)}GB, status=${snap.status}`);
  return {
    snapshotId: snap.snapshotId,
    snapshotMs: snapMs,
    snapshotSizeBytes: snap.sizeBytes,
    diskUsage,
  };
}

/** Best-effort: start dockerd, run throwaway Postgres, write a row. Non-fatal. */
async function seedBestEffort(sandbox) {
  // Diagnose availability first — is a container runtime even present?
  const probe = await run(
    sandbox,
    "command -v docker && docker --version 2>&1 || echo NO_DOCKER; command -v dockerd 2>&1 || echo NO_DOCKERD; command -v podman 2>&1 || echo NO_PODMAN",
  ).catch((e) => String(e));
  console.log(`  ℹ  runtime probe: ${probe.replace(/\n/g, " | ").trim()}`);

  // Stock runtimes ship no container runtime, so try installing Docker from the
  // Amazon Linux 2023 repos (we have sudo). This tells us whether the seeded-
  // Supabase-in-Docker pattern is portable at all. Newline-joined so the
  // backgrounded `dockerd &` doesn't collide with the next statement.
  const seedScript = [
    "set -e",
    "sudo dnf install -y docker >/tmp/dnf.log 2>&1",
    "sudo setsid dockerd </dev/null >/tmp/dockerd.log 2>&1 &",
    "for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done",
    "docker run -d --name seed-db -e POSTGRES_PASSWORD=pw postgres:16-alpine",
    "sleep 6",
    "docker exec seed-db psql -U postgres -c 'create table t(id int); insert into t values (1);'",
  ].join("\n");
  try {
    await run(sandbox, seedScript, { sudo: true, timeoutMs: 5 * 60 * 1000 });
    console.log("  ✅ docker installed + seeded postgres row");
    return { docker: true, runtimeProbe: probe.trim() };
  } catch (e) {
    // Log the FULL error (dockerd log tail included) — seeded-DB support is a
    // real migration question, so we want the reason, not just the first line.
    const dlog = await run(sandbox, "tail -5 /tmp/dockerd.log 2>/dev/null || true").catch(() => "");
    console.log(`  ⚠  seed failed (continuing). error:\n${String(e)}\n  dockerd.log tail: ${dlog.trim()}`);
    return { docker: false, runtimeProbe: probe.trim() };
  }
}

/** Restores from a snapshot N times to separate cold- from warm-cache latency. */
async function benchmarkRestore(snapshotId) {
  console.log("\n[2] Benchmarking restore from snapshot…");
  const restores = [];

  const cold = await timed("restore #1 (likely cold cache)", () =>
    createSandbox({ snapshotId }),
  );
  restores.push({ run: 1, cold: true, ms: cold.ms });
  await safeStop(cold.value);

  for (let i = 2; i <= CONFIG.warmRestoreRuns; i++) {
    const r = await timed(`restore #${i} (warm)`, () => createSandbox({ snapshotId }));
    restores.push({ run: i, cold: false, ms: r.ms });
    await safeStop(r.value);
  }

  const warm = restores.filter((r) => !r.cold).map((r) => r.ms);
  const summary = {
    coldMs: restores[0].ms,
    warmMedianMs: warm.length ? median(warm) : null,
    warmMinMs: warm.length ? Math.min(...warm) : null,
    warmMaxMs: warm.length ? Math.max(...warm) : null,
  };
  console.log(
    `  → cold ${(summary.coldMs / 1000).toFixed(2)}s | warm median ${(
      (summary.warmMedianMs ?? 0) / 1000
    ).toFixed(2)}s (n=${warm.length})`,
  );
  return { restores, summary };
}

/** Probes WebSocket-over-port, native PTY, Docker survival, and detached re-attach. */
async function probeCapabilities(snapshotId) {
  console.log("\n[3] Probing WS / PTY / docker / detached…");
  const { value: sandbox } = await timed("restore for probes", () =>
    createSandbox({ snapshotId }),
  );

  // (a) Inbound WebSocket through a public port URL — raw HTTP upgrade, no dep.
  const wsServer = `
const http=require('http'),crypto=require('crypto');
const s=http.createServer((_,r)=>r.end('ok'));
s.on('upgrade',(req,sock)=>{const k=req.headers['sec-websocket-key'];
const a=crypto.createHash('sha1').update(k+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
sock.write('HTTP/1.1 101 Switching Protocols\\r\\nUpgrade: websocket\\r\\nConnection: Upgrade\\r\\nSec-WebSocket-Accept: '+a+'\\r\\n\\r\\n');
sock.on('data',()=>sock.write(Buffer.from([0x81,0x05,0x68,0x65,0x6c,0x6c,0x6f])));});
s.listen(${CONFIG.wsPort},'0.0.0.0',()=>console.log('ws up'));`;
  await sandbox.writeFiles([{ path: `${WORKDIR}/ws.cjs`, content: wsServer }]);
  await runDetached(sandbox, `node ${WORKDIR}/ws.cjs`);
  await sleep(3000);
  const wsUrl = sandbox.domain(CONFIG.wsPort);
  const websocket = await probeWebSocket(wsUrl);
  console.log(`  → WS over port ${CONFIG.wsPort}: ${websocket.ok ? "OK" : "FAIL"} (${websocket.detail})`);

  // (b) Native interactive PTY — the createPty replacement.
  let pty = { ok: false, detail: "" };
  try {
    const { url, token } = await sandbox.openInteractive();
    pty = { ok: Boolean(url && token), detail: `url=${url.slice(0, 48)}… token=${token ? "yes" : "no"}` };
  } catch (e) {
    pty.detail = `openInteractive threw: ${String(e).split("\n")[0]}`;
  }
  console.log(`  → native PTY (openInteractive): ${pty.ok ? "OK" : "FAIL"} (${pty.detail})`);

  // (c) Docker survived the restore? (seeded row still readable)
  let docker = { ok: false, detail: "" };
  try {
    const out = await run(
      sandbox,
      "sudo pkill -9 dockerd 2>/dev/null; sudo rm -f /var/run/docker.pid /run/docker/containerd/containerd.pid 2>/dev/null; sudo setsid dockerd </dev/null >/tmp/d.log 2>&1 & for i in $(seq 1 20); do docker info >/dev/null 2>&1 && break; sleep 1; done; docker start seed-db >/dev/null 2>&1; sleep 4; docker exec seed-db psql -U postgres -tAc 'select id from t' 2>/dev/null || echo MISSING",
      { sudo: true, timeoutMs: 2 * 60 * 1000 },
    );
    docker = { ok: out.trim() === "1", detail: `select id from t => ${out.trim() || "(empty)"}` };
  } catch (e) {
    docker.detail = String(e).split("\n")[0];
  }
  console.log(`  → docker + seeded DB after restore: ${docker.ok ? "OK" : "FAIL"} (${docker.detail})`);

  // (d) Detached long-runner + re-attach.
  const longCmdId = await runDetached(sandbox, "for i in $(seq 1 600); do echo tick-$i; sleep 1; done");
  await sleep(2000);
  let reattach = { ok: false };
  try {
    const cmd = await sandbox.getCommand(longCmdId);
    reattach = { ok: Boolean(cmd) };
  } catch (e) {
    console.log(`  ⚠  getCommand re-attach failed: ${String(e).split("\n")[0]}`);
  }
  console.log(`  → detached re-attach: ${reattach.ok ? "OK" : "FAIL"}`);

  await safeStop(sandbox);
  return { websocket: { url: wsUrl, ...websocket }, pty, docker, detachedReattach: reattach };
}

/** Opens a WS to the given https preview URL and checks for an echo frame. */
async function probeWebSocket(httpsUrl) {
  const wsUrl = httpsUrl.replace(/^http/, "ws");
  return await new Promise((resolve) => {
    let settled = false;
    const done = (ok, detail) => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {}
      resolve({ ok, detail });
    };
    const socket = new WebSocket(wsUrl); // Node 22+ global
    const timer = setTimeout(() => done(false, "timeout after 10s"), 10_000);
    socket.addEventListener("open", () => socket.send("ping"));
    socket.addEventListener("message", (ev) => {
      clearTimeout(timer);
      done(true, `echo: ${String(ev.data)}`);
    });
    socket.addEventListener("error", (ev) => {
      clearTimeout(timer);
      done(false, `error: ${ev?.message ?? "unknown"}`);
    });
  });
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}
async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}
async function safeStop(sandbox) {
  try {
    await sandbox.stop();
  } catch {}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Vercel Sandbox Phase 0 spike ===");
  console.log(`runtime=${CONFIG.runtime} vcpus=${CONFIG.vcpus} bulk=${CONFIG.bulkGb}GB warmRuns=${CONFIG.warmRestoreRuns}`);

  const base = await buildBaseSnapshot();
  const restore = await benchmarkRestore(base.snapshotId);
  const probes = await probeCapabilities(base.snapshotId);

  const results = {
    generatedAt: process.env.SPIKE_RUN_TS ?? null,
    config: CONFIG,
    base,
    restore,
    probes,
    // Go/no-go thresholds from the plan.
    verdict: {
      warmUnder3s: (restore.summary.warmMedianMs ?? Infinity) <= 3000,
      coldUnder30s: restore.summary.coldMs <= 30000,
      websocketOk: probes.websocket.ok,
      nativePtyOk: probes.pty.ok,
      dockerSurvivesRestore: probes.docker.ok,
      detachedReattachOk: probes.detachedReattach.ok,
    },
  };

  await writeFile("spike-results.json", JSON.stringify(results, null, 2));
  console.log("\n=== Verdict ===");
  console.table(results.verdict);
  console.log("Full results in spike-results.json");
}

main().catch((err) => {
  console.error("\nSPIKE FAILED:", err);
  process.exit(1);
});
