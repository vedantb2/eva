// @ts-check
/**
 * Confirms the seeded carepulse DB survives in a sandbox restored from the
 * seeded snapshot. Connects to an existing (already-restored) sandbox by name,
 * restarts dockerd (fresh sessions don't auto-start it), brings the seeded
 * Supabase container back up, and reads the row count back — proving the goal.
 *
 * Usage: RESTORED_SANDBOX=<name> node verify-restored.mjs
 */
import { Sandbox } from "@vercel/sandbox";

const CREDS = {
  token: process.env.VERCEL_TOKEN,
  teamId: process.env.VERCEL_TEAM_ID,
  projectId: process.env.VERCEL_PROJECT_ID,
};
const NAME = process.env.RESTORED_SANDBOX;
if (!NAME) {
  console.error("Set RESTORED_SANDBOX=<sandbox name>");
  process.exit(1);
}

const sandbox = await Sandbox.get({ ...CREDS, name: NAME });

/** Run a command as root, return {exitCode, out, err}. */
async function sh(cmd, timeoutMs = 3 * 60 * 1000) {
  const c = await sandbox.runCommand({ cmd: "bash", args: ["-lc", cmd], sudo: true, timeoutMs });
  return { exitCode: c.exitCode, out: await c.stdout().catch(() => ""), err: await c.stderr().catch(() => "") };
}

console.log(`Verifying restored sandbox ${NAME}…`);

// 1. repo + node_modules baked in?
const repo = await sh("test -d /vercel/sandbox/repo/node_modules && echo yes || echo no");
console.log(`repo+node_modules present: ${repo.out.trim()}`);

// 2. agent CLIs baked in?
const clis = await sh(
  "for t in claude codex opencode agent-browser convex supabase; do printf '%s=' $t; (command -v $t >/dev/null && echo ok) || echo MISSING; done",
);
console.log("CLIs: " + clis.out.replace(/\n/g, " ").trim());

// 3. bring dockerd + the seeded Supabase container back up
await sh(
  "pkill -9 dockerd 2>/dev/null; rm -f /var/run/docker.pid /run/docker/containerd/containerd.pid 2>/dev/null; setsid dockerd </dev/null >/tmp/d.log 2>&1 & for i in $(seq 1 40); do docker info >/dev/null 2>&1 && break; sleep 1; done; docker info >/dev/null 2>&1 && echo docker-up",
);
const containers = await sh("docker ps -a --format '{{.Names}} {{.Status}}' | head");
console.log("containers:\n" + containers.out.trim());

await sh("docker start supabase_db_web >/dev/null 2>&1 || true; for i in $(seq 1 60); do docker exec supabase_db_web pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done; true");

// 4. read the seeded rows back. ANALYZE first so n_live_tup is accurate (it is
// cold/zero right after a fresh Postgres start). Also print the top tables by
// real row count as concrete proof the seed data survived the restore.
const analyzed = await sh(
  "docker exec supabase_db_web psql -U postgres -d postgres -tAc \"ANALYZE; select coalesce(sum(n_live_tup),0) from pg_stat_user_tables\" 2>&1",
);
const top = await sh(
  "docker exec supabase_db_web psql -U postgres -d postgres -tAc \"select relname||'='||n_live_tup from pg_stat_user_tables where n_live_tup>0 order by n_live_tup desc limit 8\" 2>&1",
);
console.log(`\nSEEDED DB AFTER RESTORE → total live rows (post-ANALYZE): ${analyzed.out.trim()}`);
console.log("top seeded tables:\n" + top.out.trim());
