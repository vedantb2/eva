"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { ensureDockerDaemon, exec, workspaceDirShell } from "./helpers";

const SUPABASE_DUMP_PATH =
  "/home/eva/.eva-snapshot-state/supabase-db-web.pg_dump.sql.gz";
const SUPABASE_RESTORE_MARKER = "/tmp/.eva-supabase-db-web-restored";

/** Detects the package manager (pnpm, yarn, or npm) by checking lock files. */
export async function detectPackageManager(
  sandbox: Sandbox,
  rootDir = "",
): Promise<string> {
  const dir = rootDir
    ? `${workspaceDirShell()}/${rootDir}`
    : workspaceDirShell();
  const lockFile = (
    await exec(
      sandbox,
      `cd ${dir} && ls -1 | grep -E '^(pnpm-lock.yaml|yarn.lock)$' | head -n1`,
      5,
    )
  ).trim();
  if (lockFile === "pnpm-lock.yaml") return "pnpm";
  if (lockFile === "yarn.lock") return "yarn";
  return "npm";
}

/** Type guard that checks if a value is a non-array plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const FRAMEWORK_DEFAULT_PORTS: Record<string, number> = {
  next: 3000,
  nuxt: 3000,
  vite: 5173,
  "@angular/core": 4200,
};

/** Detects the dev server port from package.json scripts or framework defaults. */
export async function detectDevPort(
  sandbox: Sandbox,
  rootDir: string,
): Promise<number> {
  const dir = rootDir
    ? `${workspaceDirShell()}/${rootDir}`
    : workspaceDirShell();
  try {
    const raw = await exec(
      sandbox,
      `cat ${dir}/package.json 2>/dev/null || echo "{}"`,
      5,
    );
    const pkg: unknown = JSON.parse(raw);
    if (!isRecord(pkg)) return 3000;

    const scripts = isRecord(pkg.scripts) ? pkg.scripts : {};
    const devScript = typeof scripts.dev === "string" ? scripts.dev : "";

    const portMatch = devScript.match(/(?:--port|--p|-p|PORT=)\s*(\d+)/);
    if (portMatch?.[1]) {
      return parseInt(portMatch[1], 10);
    }

    const deps = isRecord(pkg.dependencies) ? pkg.dependencies : {};
    const devDeps = isRecord(pkg.devDependencies) ? pkg.devDependencies : {};
    const allDeps = { ...deps, ...devDeps };
    for (const [framework, port] of Object.entries(FRAMEWORK_DEFAULT_PORTS)) {
      if (framework in allDeps) return port;
    }
  } catch {
    // couldn't read package.json
  }
  return 3000;
}

/**
 * Detects package manager and dev port, returning the dev command for the session.
 *
 * `overrides` lets a user-defined config (stored on `githubRepos`) take precedence
 * over auto-detection:
 * - `overrides.devPort` short-circuits port detection.
 * - `overrides.devCommand` is run verbatim — the user owns `cd` and `PORT=`.
 *   We still resolve a port for downstream consumers (preview URL routing) using
 *   the override port, else detection.
 */
export async function startSessionServices(
  sandbox: Sandbox,
  rootDir: string,
  overrides?: { devPort?: number; devCommand?: string },
): Promise<{ port: number; devCommand: string }> {
  await restoreSeededRuntimeState(sandbox);

  const port =
    overrides?.devPort !== undefined
      ? overrides.devPort
      : await detectDevPort(sandbox, rootDir);

  if (overrides?.devCommand && overrides.devCommand.trim().length > 0) {
    return { port, devCommand: overrides.devCommand };
  }

  const pm = await detectPackageManager(sandbox, rootDir);
  const dir = rootDir
    ? `${workspaceDirShell()}/${rootDir}`
    : workspaceDirShell();
  const devCommand = `cd ${dir} && PORT=${port} ${pm} run dev`;
  return { port, devCommand };
}

/** Restores service state that was exported into a seeded snapshot filesystem. */
export async function restoreSeededRuntimeState(
  sandbox: Sandbox,
): Promise<void> {
  try {
    await exec(sandbox, `test -f ${SUPABASE_DUMP_PATH}`, 5);
  } catch {
    return;
  }

  try {
    await exec(sandbox, `test -f ${SUPABASE_RESTORE_MARKER}`, 5);
    return;
  } catch {
    // No marker means this fresh sandbox still needs its local service state.
  }

  await ensureDockerDaemon(sandbox);
  await exec(
    sandbox,
    [
      "set -e",
      "set -o pipefail",
      "cd /tmp/repo",
      "if docker ps --filter name=supabase_db_web --filter status=running -q | grep -q .; then",
      '  echo "supabase_db_web already running"',
      "elif docker ps -a --filter name=supabase_db_web -q | grep -q .; then",
      "  docker start supabase_db_web >/dev/null",
      '  echo "started existing supabase_db_web"',
      "else",
      "  pnpm start-db",
      "fi",
      "for i in $(seq 1 240); do",
      "  if docker exec supabase_db_web pg_isready -U postgres >/dev/null 2>&1; then break; fi",
      "  sleep 1",
      "done",
      "docker exec supabase_db_web pg_isready -U postgres >/dev/null 2>&1",
      `gzip -dc ${SUPABASE_DUMP_PATH} | docker exec -i supabase_db_web psql -U postgres -d postgres -v ON_ERROR_STOP=1 >/tmp/eva-supabase-db-web-restore.log 2>&1 || { tail -120 /tmp/eva-supabase-db-web-restore.log; exit 1; }`,
      `touch ${SUPABASE_RESTORE_MARKER}`,
      'echo "restored supabase_db_web from seeded snapshot dump"',
    ].join("; "),
    600,
  );
}

/** Stable default terminal pane id — must match `sandboxPanes.defaultPane`. */
export function defaultTerminalPtyId(ownerKey: string): string {
  return `${ownerKey}-terminal-default`;
}

/**
 * Drops the shared dev-server PTY after a stopped sandbox is resumed.
 * The web terminal only auto-runs `devCommand` when `connectPty` reports
 * `isNewPty`; a surviving PTY from before stop would skip that path.
 */
export async function resetDevTerminalForResume(
  sandbox: Sandbox,
  ownerKey: string,
): Promise<void> {
  try {
    await sandbox.process.killPtySession(defaultTerminalPtyId(ownerKey));
  } catch {
    // PTY may already be gone after archive/stop.
  }
}

/** Starts the dev server detached so preview can load without an open terminal tab. */
export async function launchDevServerInBackground(
  sandbox: Sandbox,
  devCommand: string,
): Promise<void> {
  await exec(sandbox, `${devCommand} > /tmp/devserver.log 2>&1 &`, 10);
}
