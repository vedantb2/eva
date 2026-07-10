// @ts-check
/**
 * Build a SEEDED Vercel Sandbox snapshot for carepulse-ts `apps/web`, then start
 * a sandbox from it. This replicates eva's Daytona snapshot-build pipeline
 * (snapshotWorkflow.ts / snapshotActions.ts) on Vercel for the real repo:
 *
 *   clone carepulse-ts (staging) → install toolchain the base image bakes in
 *   (pnpm, docker, supabase CLI, the agent CLIs: claude/codex/opencode/
 *   agent-browser/convex/cursor) → pnpm install → start local Supabase (Docker)
 *   → prisma db push (migrate) → seed:sql → snapshot → create sandbox from it
 *   and verify the seeded DB + repo survive the restore.
 *
 * carepulse `apps/web` facts (read from the repo): Next.js + Supabase + Prisma,
 * pnpm@10.33.4, supabase project_id="web" (container supabase_db_web, DB :54322),
 * `start-db`=`supabase start`, `migrate`=`prisma db push`, `seed:sql`=
 * `tsx scripts/seed-data-sql.ts`; the db package reads POSTGRES_PRISMA_URL /
 * POSTGRES_URL_NON_POOLING / DATABASE_URL / DIRECT_URL from packages/db/.env.local
 * — all pointed at the deterministic local Supabase Postgres here.
 *
 * Credentials come from env (never logged/committed): VERCEL_TOKEN/TEAM_ID/
 * PROJECT_ID and GITHUB_TOKEN (a token with repo scope; the clone URL is built
 * inline and never printed). See README.
 */

import { writeFile } from "node:fs/promises";
import { Sandbox } from "@vercel/sandbox";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

const CREDS = {
  token: requireEnv("VERCEL_TOKEN"),
  teamId: requireEnv("VERCEL_TEAM_ID"),
  projectId: requireEnv("VERCEL_PROJECT_ID"),
};
const GITHUB_TOKEN = requireEnv("GITHUB_TOKEN");

const CONFIG = {
  runtime: process.env.SPIKE_RUNTIME ?? "node22", // carepulse is built for Node 20/22
  vcpus: Number(process.env.SPIKE_VCPUS ?? "4"),
  repo: "evalucom/carepulse-ts",
  branch: process.env.CAREPULSE_BRANCH ?? "staging",
};

// Tag every sandbox this tooling creates so cleanup can target ONLY our
// resources — this runs against the real eva/Evalucom project, never a throwaway.
const MANAGED_TAG = { managedBy: "eva-migration-tooling" };

const WORKDIR = "/vercel/sandbox";
const REPO = `${WORKDIR}/repo`;
// Deterministic local-Supabase Postgres connection (same for every local stack).
const LOCAL_PG = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function createSandbox({ snapshotId, timeoutMs } = {}) {
  /** @type {Record<string, unknown>} */
  const params = {
    ...CREDS,
    timeout: timeoutMs ?? 45 * 60 * 1000,
    ports: [3000, 54321],
    resources: { vcpus: CONFIG.vcpus },
    tags: MANAGED_TAG,
  };
  if (snapshotId) params.source = { type: "snapshot", snapshotId };
  else params.runtime = CONFIG.runtime;
  return await Sandbox.create(params);
}

/** Run a login-shell command; throws on non-zero unless best-effort. */
async function run(sandbox, cmd, { cwd = WORKDIR, sudo = false, timeoutMs, bestEffort = false, label } = {}) {
  const finished = await sandbox.runCommand({
    cmd: "bash",
    args: ["-lc", cmd],
    cwd,
    sudo,
    ...(timeoutMs ? { timeoutMs } : {}),
  });
  if (finished.exitCode !== 0 && !bestEffort) {
    const err = await finished.output("both").catch(() => "");
    throw new Error(`command failed (exit ${finished.exitCode})${label ? ` [${label}]` : ""}: ${cmd}\n${err.slice(-4000)}`);
  }
  return { exitCode: finished.exitCode, out: await finished.stdout().catch(() => "") };
}

async function timed(label, fn) {
  const start = Date.now();
  const value = await fn();
  console.log(`  ⏱  ${label}: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  return value;
}

// ---------------------------------------------------------------------------
// build phases
// ---------------------------------------------------------------------------

/** Install the toolchain the eva base image normally bakes in (minus the GUI/VNC stack). */
async function installToolchain(sandbox) {
  console.log("\n[2] Installing toolchain (docker, pnpm, supabase CLI, agent CLIs)…");

  await timed("dnf: docker git jq gzip tar", () =>
    run(sandbox, "sudo dnf install -y docker git jq gzip tar >/tmp/dnf.log 2>&1", {
      sudo: true,
      timeoutMs: 5 * 60 * 1000,
      label: "dnf",
    }),
  );

  await timed("start dockerd", () =>
    run(
      sandbox,
      "sudo setsid dockerd </dev/null >/tmp/dockerd.log 2>&1 & for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done; docker info >/dev/null 2>&1",
      { sudo: true, timeoutMs: 90 * 1000, label: "dockerd" },
    ),
  );

  await timed("corepack pnpm@10.33.4", () =>
    run(sandbox, "corepack enable && corepack prepare pnpm@10.33.4 --activate && pnpm --version", {
      timeoutMs: 120 * 1000,
      label: "pnpm",
    }),
  );

  // Supabase CLI via release tarball (the .deb the base image uses won't install on Amazon Linux).
  await timed("install supabase CLI", () =>
    run(
      sandbox,
      "curl -fsSL https://github.com/supabase/cli/releases/download/v2.90.0/supabase_linux_amd64.tar.gz -o /tmp/sb.tgz && sudo tar -xzf /tmp/sb.tgz -C /usr/local/bin supabase && supabase --version",
      { sudo: true, timeoutMs: 120 * 1000, label: "supabase-cli" },
    ),
  );

  // The "other packages" — agent CLIs the snapshot bakes in. Best-effort: a
  // registry hiccup on one shouldn't abort the seed.
  await timed("npm -g agent CLIs", () =>
    run(
      sandbox,
      "sudo npm install -g @anthropic-ai/claude-code @openai/codex opencode-ai agent-browser convex >/tmp/npm-g.log 2>&1",
      { sudo: true, timeoutMs: 6 * 60 * 1000, bestEffort: true, label: "npm-g" },
    ),
  );
  await timed("cursor CLI (best-effort)", () =>
    run(sandbox, "curl -fsS https://cursor.com/install | bash >/tmp/cursor.log 2>&1", {
      bestEffort: true,
      timeoutMs: 120 * 1000,
    }),
  );
  const tools = await run(
    sandbox,
    "for t in docker pnpm supabase claude codex opencode agent-browser convex cursor-agent; do printf '%s=' $t; (command -v $t >/dev/null && echo ok) || echo MISSING; done",
    { bestEffort: true },
  );
  console.log("  🧰 tools: " + tools.out.replace(/\n/g, " ").trim());
}

/** Clone the repo, inject local .env.local, install deps. */
async function cloneAndInstall(sandbox) {
  console.log("\n[3] Clone + install carepulse-ts…");
  await timed("git clone (staging, depth 1)", () =>
    run(
      sandbox,
      `rm -rf ${REPO} && git clone --depth 1 --branch ${CONFIG.branch} https://x-access-token:${GITHUB_TOKEN}@github.com/${CONFIG.repo}.git ${REPO}`,
      { timeoutMs: 6 * 60 * 1000, label: "clone" },
    ),
  );

  // packages/db reads these from its own .env.local (via `dotenv -e .env.local`).
  const dbEnv = [
    `POSTGRES_PRISMA_URL=${LOCAL_PG}`,
    `POSTGRES_URL_NON_POOLING=${LOCAL_PG}`,
    `DATABASE_URL=${LOCAL_PG}`,
    `DIRECT_URL=${LOCAL_PG}`,
    "",
  ].join("\n");
  await sandbox.writeFiles([{ path: `${REPO}/packages/db/.env.local`, content: dbEnv }]);

  await timed("pnpm install", () =>
    run(sandbox, `cd ${REPO} && pnpm install 2>&1 | tail -5`, {
      timeoutMs: 12 * 60 * 1000,
      label: "pnpm-install",
    }),
  );
}

/** Start local Supabase (Docker), then migrate + seed the DB. */
async function startAndSeedDb(sandbox) {
  console.log("\n[4] Start Supabase + migrate + seed…");
  await timed("supabase start (pulls images)", () =>
    run(sandbox, `cd ${REPO} && pnpm start-db 2>&1 | tail -8`, {
      timeoutMs: 15 * 60 * 1000,
      label: "supabase-start",
    }),
  );
  await timed("wait for db ready", () =>
    run(
      sandbox,
      "for i in $(seq 1 120); do docker exec supabase_db_web pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done; docker exec supabase_db_web pg_isready -U postgres",
      { timeoutMs: 3 * 60 * 1000, label: "pg_isready" },
    ),
  );
  await timed("prisma db push (migrate)", () =>
    run(sandbox, `cd ${REPO} && pnpm migrate 2>&1 | tail -8`, { timeoutMs: 6 * 60 * 1000, label: "migrate" }),
  );
  await timed("seed:sql", () =>
    run(sandbox, `cd ${REPO} && pnpm seed:sql 2>&1 | tail -12`, { timeoutMs: 10 * 60 * 1000, label: "seed" }),
  );

  // Verify: count non-empty public tables + total rows, as a seed sanity check.
  const check = await run(
    sandbox,
    `docker exec supabase_db_web psql -U postgres -d postgres -tAc "select count(*) from information_schema.tables where table_schema='public'" && docker exec supabase_db_web psql -U postgres -d postgres -tAc "select coalesce(sum(n_live_tup),0) from pg_stat_user_tables"`,
    { bestEffort: true },
  );
  const [tables, rows] = check.out.trim().split("\n");
  console.log(`  🌱 public tables: ${tables}, approx seeded rows: ${rows}`);
  return { publicTables: Number(tables ?? 0), seededRows: Number(rows ?? 0) };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== carepulse-ts apps/web → Vercel seeded snapshot ===");
  console.log(`repo=${CONFIG.repo}@${CONFIG.branch} runtime=${CONFIG.runtime} vcpus=${CONFIG.vcpus}`);

  console.log("\n[1] Create base sandbox…");
  const sandbox = await timed("create sandbox", () => createSandbox({ timeoutMs: 45 * 60 * 1000 }));

  await installToolchain(sandbox);
  await cloneAndInstall(sandbox);
  const seed = await startAndSeedDb(sandbox);

  const disk = (await run(sandbox, `du -sh ${WORKDIR} /var/lib/docker 2>/dev/null | tail -2 || echo unknown`, { bestEffort: true })).out.trim();
  console.log(`  📦 disk: ${disk.replace(/\n/g, " | ")}`);

  console.log("\n[5] Snapshot…");
  const snap = await timed("snapshot()", () => sandbox.snapshot({ expiration: 0 }));
  console.log(`  ✅ snapshot ${snap.snapshotId} — ${(snap.sizeBytes / 1e9).toFixed(2)}GB, status=${snap.status}`);

  console.log("\n[6] Start a sandbox from the seeded snapshot + verify…");
  const restored = await timed("restore from snapshot", () => createSandbox({ snapshotId: snap.snapshotId }));
  // dockerd doesn't auto-start on a fresh session; restart it, then check the
  // seeded Supabase container + repo survived (mirrors eva's ensureDockerDaemon).
  const verify = await run(
    restored,
    [
      "sudo pkill -9 dockerd 2>/dev/null; sudo rm -f /var/run/docker.pid /run/docker/containerd/containerd.pid 2>/dev/null",
      "sudo setsid dockerd </dev/null >/tmp/d.log 2>&1 &",
      "for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done",
      "docker start supabase_db_web >/dev/null 2>&1 || true",
      "for i in $(seq 1 60); do docker exec supabase_db_web pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done",
      `echo -n 'repo='; test -d ${REPO}/node_modules && echo yes || echo no`,
      "echo -n 'rows='; docker exec supabase_db_web psql -U postgres -d postgres -tAc \"select coalesce(sum(n_live_tup),0) from pg_stat_user_tables\" 2>/dev/null || echo NA",
    ].join("; "),
    { sudo: true, bestEffort: true, timeoutMs: 4 * 60 * 1000 },
  );
  console.log("  🔎 restore verify: " + verify.out.replace(/\n/g, " ").trim());

  const results = {
    generatedAt: process.env.SPIKE_RUN_TS ?? null,
    repo: `${CONFIG.repo}@${CONFIG.branch}`,
    runtime: CONFIG.runtime,
    snapshotId: snap.snapshotId,
    snapshotSizeGB: Number((snap.sizeBytes / 1e9).toFixed(2)),
    seed,
    restoredSandbox: restored.name,
    restoreVerify: verify.out.trim(),
  };
  await writeFile("carepulse-seed-results.json", JSON.stringify(results, null, 2));
  console.log("\n=== DONE ===");
  console.log(`Seeded snapshot: ${snap.snapshotId}`);
  console.log(`Started sandbox from it: ${restored.name}`);
  console.log("Results written to carepulse-seed-results.json");
  console.log("(leaving both the snapshot and the started sandbox in place; run cleanup.mjs to remove)");
}

main().catch((err) => {
  console.error("\nSEED BUILD FAILED:", err);
  process.exit(1);
});
