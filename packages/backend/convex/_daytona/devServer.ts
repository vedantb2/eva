"use node";

import { z } from "zod";
import type { Sandbox } from "@daytonaio/sdk";
import type { SandboxHandle } from "../_sandbox/provider";
import {
  ensureDockerDaemon,
  exec,
  execHandle,
  bootstrapVercelDocker,
  workspaceDirShell,
} from "./helpers";

const SUPABASE_DUMP_PATH =
  "/home/eva/.eva-snapshot-state/supabase-db-web.pg_dump.sql.gz";
const SUPABASE_RESTORE_MARKER = "/tmp/.eva-supabase-db-web-restored";

/** Detects the package manager (pnpm, yarn, or npm) by checking lock files. */
export async function detectPackageManager(
  sandbox: SandboxHandle,
  rootDir = "",
): Promise<string> {
  const workspaceRoot = workspaceDirShell();
  const dir = rootDir ? `${workspaceRoot}/${rootDir}` : workspaceRoot;
  // Prefer the package rootDir, then fall back to the workspace root — monorepos
  // often keep pnpm-lock.yaml at the repo root while rootDirectory points at an app.
  // Also treat packageManager / workspace: deps as pnpm so npm never hits workspace:*.
  const detection = (
    await execHandle(
      sandbox,
      [
        `if [ -f ${dir}/pnpm-lock.yaml ] || [ -f ${workspaceRoot}/pnpm-lock.yaml ]; then echo pnpm;`,
        `elif [ -f ${dir}/yarn.lock ] || [ -f ${workspaceRoot}/yarn.lock ]; then echo yarn;`,
        `elif grep -q '"packageManager"[[:space:]]*:[[:space:]]*"pnpm@' ${dir}/package.json ${workspaceRoot}/package.json 2>/dev/null; then echo pnpm;`,
        `elif grep -q 'workspace:' ${dir}/package.json ${workspaceRoot}/package.json 2>/dev/null; then echo pnpm;`,
        `else echo npm; fi`,
      ].join(" "),
      5,
    )
  ).trim();
  if (detection === "pnpm") return "pnpm";
  if (detection === "yarn") return "yarn";
  return "npm";
}

// Boundary schema for the sandbox package.json. Only the fields dev-port
// detection needs are modelled; anything malformed falls back to empty via
// `.catch`, so detection degrades to framework defaults instead of throwing.
const packageJsonSchema = z
  .object({
    scripts: z.record(z.string(), z.string()).catch({}),
    dependencies: z.record(z.string(), z.string()).catch({}),
    devDependencies: z.record(z.string(), z.string()).catch({}),
  })
  .catch({ scripts: {}, dependencies: {}, devDependencies: {} });

const FRAMEWORK_DEFAULT_PORTS: Record<string, number> = {
  next: 3000,
  nuxt: 3000,
  vite: 5173,
  "@angular/core": 4200,
};

/** Detects the dev server port from package.json scripts or framework defaults. */
export async function detectDevPort(
  sandbox: SandboxHandle,
  rootDir: string,
): Promise<number> {
  const dir = rootDir
    ? `${workspaceDirShell()}/${rootDir}`
    : workspaceDirShell();
  try {
    const raw = await execHandle(
      sandbox,
      `cat ${dir}/package.json 2>/dev/null || echo "{}"`,
      5,
    );
    const pkg = packageJsonSchema.parse(JSON.parse(raw));

    const devScript = pkg.scripts.dev ?? "";
    const portMatch = devScript.match(/(?:--port|--p|-p|PORT=)\s*(\d+)/);
    if (portMatch?.[1]) {
      return parseInt(portMatch[1], 10);
    }

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
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
  sandbox: SandboxHandle,
  rootDir: string,
  overrides?: { devPort?: number; devCommand?: string },
): Promise<{ port: number; devCommand: string }> {
  await restoreSeededRuntimeState(sandbox);

  const port =
    overrides?.devPort !== undefined
      ? overrides.devPort
      : await detectDevPort(sandbox, rootDir);

  if (overrides?.devCommand && overrides.devCommand.trim().length > 0) {
    return {
      port,
      devCommand: `cd ${workspaceDirShell()} && HOSTNAME=0.0.0.0 PORT=${port} ${overrides.devCommand}`,
    };
  }

  const pm = await detectPackageManager(sandbox, rootDir);
  const dir = rootDir
    ? `${workspaceDirShell()}/${rootDir}`
    : workspaceDirShell();
  const devCommand = `cd ${dir} && HOSTNAME=0.0.0.0 PORT=${port} ${pm} run dev`;
  return { port, devCommand };
}

/** Restores service state that was exported into a seeded snapshot filesystem. */
export async function restoreSeededRuntimeState(
  sandbox: SandboxHandle,
): Promise<void> {
  try {
    await execHandle(sandbox, `test -f ${SUPABASE_DUMP_PATH}`, 5);
  } catch {
    return;
  }

  try {
    await execHandle(sandbox, `test -f ${SUPABASE_RESTORE_MARKER}`, 5);
    return;
  } catch {
    // No marker means this fresh sandbox still needs its local service state.
  }

  const dockerReady =
    (await ensureDockerDaemon(sandbox)) ||
    (await bootstrapVercelDocker(sandbox));
  if (!dockerReady) {
    console.log(
      `[daytona] restoreSeededRuntimeState: docker unavailable on ${sandbox.id}, skipping supabase dump restore (startup commands will bootstrap)`,
    );
    return;
  }
  await execHandle(
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
      `docker exec supabase_db_web psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DO \\$\\$ DECLARE tables text; BEGIN SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') INTO tables FROM pg_tables WHERE schemaname = 'public'; IF tables IS NOT NULL THEN EXECUTE 'TRUNCATE TABLE ' || tables || ' CASCADE'; END IF; END \\$\\$;" >/tmp/eva-supabase-db-web-truncate.log 2>&1 || { tail -120 /tmp/eva-supabase-db-web-truncate.log; exit 1; }`,
      `gzip -dc ${SUPABASE_DUMP_PATH} | docker exec -i supabase_db_web psql -U postgres -d postgres -v ON_ERROR_STOP=1 >/tmp/eva-supabase-db-web-restore.log 2>&1 || { tail -120 /tmp/eva-supabase-db-web-restore.log; exit 1; }`,
      `touch ${SUPABASE_RESTORE_MARKER}`,
      'echo "restored supabase_db_web from seeded snapshot dump"',
      // Join with newlines, not "; ": the script contains if/elif/else/for
      // blocks, and "then; ", "else; ", "do; " are bash syntax errors
      // ("syntax error near unexpected token ';'"). Newlines terminate those
      // keywords correctly and are valid statement separators everywhere else.
    ].join("\n"),
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

const EVA_ENV_FILE = "/vercel/sandbox/.eva-env.sh";

const DEVSERVER_LOCK = "/tmp/eva-devserver.lock";
const DEVSERVER_LAST_LAUNCH = "/tmp/eva-devserver-last-launch";
const DEVSERVER_RELAUNCH_COOLDOWN_SECONDS = 20;

/** Starts the dev server detached so preview can load without an open terminal tab. */
export async function launchDevServerInBackground(
  sandbox: SandboxHandle,
  devCommand: string,
  port: number,
): Promise<void> {
  const launchState = (
    await execHandle(
      sandbox,
      [
        `LOCK=${DEVSERVER_LOCK}`,
        `LAST=${DEVSERVER_LAST_LAUNCH}`,
        'pid=$(cat "$LOCK" 2>/dev/null || true)',
        'if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then echo active; exit 0; fi',
        "now=$(date +%s)",
        'last=$(cat "$LAST" 2>/dev/null || echo 0)',
        `if [ $((now - last)) -lt ${DEVSERVER_RELAUNCH_COOLDOWN_SECONDS} ]; then echo recent; exit 0; fi`,
        'echo "$now" > "$LAST"',
        "echo launch",
      ].join("; "),
      5,
      "/",
    )
  ).trim();
  if (launchState !== "launch") {
    return;
  }

  const script = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `[ -f ${EVA_ENV_FILE} ] && . ${EVA_ENV_FILE}`,
    `WORKSPACE_DIR=${workspaceDirShell()}`,
    'cd "$WORKSPACE_DIR"',
    'export INIT_CWD="$WORKSPACE_DIR"',
    `LOCK=${DEVSERVER_LOCK}`,
    'if [ -f "$LOCK" ]; then',
    '  oldpid=$(cat "$LOCK" 2>/dev/null || true)',
    '  if [ -n "$oldpid" ] && kill -0 "$oldpid" 2>/dev/null; then',
    "    exit 0",
    "  fi",
    "fi",
    `if command -v fuser >/dev/null 2>&1; then fuser -k ${port}/tcp >/dev/null 2>&1 || true`,
    `elif command -v lsof >/dev/null 2>&1; then for p in $(lsof -ti :${port} 2>/dev/null || true); do kill "$p" 2>/dev/null || true; done`,
    "fi",
    'echo $$ > "$LOCK"',
    "trap 'rm -f \"$LOCK\"' EXIT",
    devCommand,
  ].join("\n");
  await sandbox.writeFile("/tmp/eva-launch-devserver.sh", script);
  await sandbox.execDetached(
    "chmod +x /tmp/eva-launch-devserver.sh && /tmp/eva-launch-devserver.sh >> /tmp/devserver.log 2>&1",
    { timeoutSeconds: 15 },
  );
  console.log(
    `[daytona] launchDevServerInBackground: launched on ${sandbox.id} port=${port}`,
  );
}
