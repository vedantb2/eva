"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { exec, workspaceDirShell } from "./helpers";

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

/** Detects package manager and dev port, returning the dev command for the session. */
export async function startSessionServices(
  sandbox: Sandbox,
  rootDir: string,
): Promise<{ port: number; devCommand: string }> {
  const pm = await detectPackageManager(sandbox, rootDir);
  const port = await detectDevPort(sandbox, rootDir);
  const dir = rootDir
    ? `${workspaceDirShell()}/${rootDir}`
    : workspaceDirShell();
  const devCommand = `cd ${dir} && PORT=${port} ${pm} run dev`;
  return { port, devCommand };
}
