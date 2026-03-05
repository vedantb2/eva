"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { exec, WORKSPACE_DIR } from "./helpers";

export async function detectPackageManager(
  sandbox: Sandbox,
  rootDir = "",
): Promise<string> {
  const dir = rootDir ? `${WORKSPACE_DIR}/${rootDir}` : WORKSPACE_DIR;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const FRAMEWORK_DEFAULT_PORTS: Record<string, number> = {
  next: 3000,
  nuxt: 3000,
  vite: 5173,
  "@angular/core": 4200,
};

export async function detectDevPort(
  sandbox: Sandbox,
  rootDir: string,
): Promise<number> {
  const dir = rootDir ? `${WORKSPACE_DIR}/${rootDir}` : WORKSPACE_DIR;
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

export async function startSessionServices(
  sandbox: Sandbox,
  rootDir: string,
): Promise<{ port: number; devCommand: string }> {
  const pm = await detectPackageManager(sandbox, rootDir);
  const port = await detectDevPort(sandbox, rootDir);
  const dir = rootDir ? `${WORKSPACE_DIR}/${rootDir}` : WORKSPACE_DIR;
  const devCommand = `cd ${dir} && PORT=${port} ${pm} run dev`;
  return { port, devCommand };
}
