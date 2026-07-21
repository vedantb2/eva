/**
 * Vercel app/dev preview port map (mirrors desktop 16080→6080 / editor 18080→8080).
 *
 * Public auth proxy owns the app's configured port (3000, 3001, 5173, …) so Preview
 * matches the repo. The app listens on logical+10000 so the proxy can bind the
 * public port. Exposed 54321 stays for local Supabase Kong — not Eva's proxy.
 *
 * Reserved public slots (desktop 6080, editor 8080, supabase 54321) cannot be the
 * app proxy; those fall back to 3000.
 */

/** Fallback when the logical port is reserved for desktop/editor/supabase. */
export const VERCEL_APP_PUBLIC_PORT_FALLBACK = 3000;

/** @deprecated Use {@link vercelAppPublicPort}; kept as the common default. */
export const VERCEL_PREVIEW_PROXY_PORT = VERCEL_APP_PUBLIC_PORT_FALLBACK;

/** Listen port when logical is 3000 (3000+10000). */
export const VERCEL_APP_INTERNAL_PORT = 13000;

const VERCEL_RESERVED_PUBLIC_PORTS = new Set([6080, 8080, 54321]);

function isUsablePort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

/**
 * Public auth-proxy port for this app's logical/UI port (Preview bar / repo.devPort).
 * Prefer the app's own port so Vite (5173) and Next (3000/3001) each get their host.
 */
export function vercelAppPublicPort(logicalPort: number): number {
  if (
    isUsablePort(logicalPort) &&
    !VERCEL_RESERVED_PUBLIC_PORTS.has(logicalPort)
  ) {
    return logicalPort;
  }
  return VERCEL_APP_PUBLIC_PORT_FALLBACK;
}

/**
 * Where the app listens inside a Vercel sandbox.
 * Always off the public proxy port (3000→13000, 3001→13001, 5173→15173).
 */
export function vercelAppListenPort(logicalPort: number): number {
  const publicPort = vercelAppPublicPort(logicalPort);
  const listenBase = isUsablePort(logicalPort)
    ? logicalPort
    : VERCEL_APP_PUBLIC_PORT_FALLBACK;
  const candidate = listenBase + 10000;
  if (isUsablePort(candidate) && candidate !== publicPort) {
    return candidate;
  }
  // Extreme logical ports: keep a stable internal that is not the public slot.
  if (VERCEL_APP_INTERNAL_PORT !== publicPort) {
    return VERCEL_APP_INTERNAL_PORT;
  }
  return VERCEL_APP_INTERNAL_PORT + 1;
}

/**
 * Force the Vercel listen port even when a nested package.json script hardcodes
 * `-p 3001` / `--port 3001` (CarePulse eprocurement). Outer `PORT=` alone is not
 * enough — Next prefers an explicit CLI port flag.
 *
 * Rewrites `PORT=` / `-p` / `--port` on the outer command, then appends
 * ` -- -p <listen>` for npm/pnpm/yarn/bun so the last port wins inside the script.
 */
export function withVercelAppListenPort(
  logicalPort: number,
  devCommand: string,
): { listenPort: number; publicPort: number; devCommand: string } {
  const publicPort = vercelAppPublicPort(logicalPort);
  const listenPort = vercelAppListenPort(logicalPort);
  if (listenPort === logicalPort) {
    return { listenPort, publicPort, devCommand };
  }

  let command = devCommand.replace(
    new RegExp(`PORT=${logicalPort}\\b`),
    `PORT=${listenPort}`,
  );
  command = command.replace(
    new RegExp(`(-p|--port)\\s+${logicalPort}\\b`, "g"),
    `$1 ${listenPort}`,
  );

  const listenFlag = `-p ${listenPort}`;
  const alreadyForced =
    command.includes(` -- ${listenFlag}`) ||
    command.includes(` -- --port ${listenPort}`) ||
    new RegExp(`(?:-p|--port)\\s+${listenPort}\\b`).test(command);

  if (alreadyForced) {
    return { listenPort, publicPort, devCommand: command };
  }

  // Nested scripts (e.g. `"dev": "next dev -p 3001"`) ignore PORT=; forward a
  // trailing port so the last `-p` wins (Next/Vite CLI). Only touch app-dev
  // invocations — not `pnpm turbo` / install / etc.
  if (/\bnext\s+dev\b/.test(command)) {
    command = `${command} ${listenFlag}`;
  } else if (
    /\b(pnpm|npm|yarn|bun)\b/.test(command) &&
    /\b(run\s+)?dev\b/.test(command)
  ) {
    command = /\s--\s/.test(command)
      ? `${command} ${listenFlag}`
      : `${command} -- ${listenFlag}`;
  }

  return { listenPort, publicPort, devCommand: command };
}

/**
 * Fixed 4-port expose list with `publicPort` first (app proxy 3000/3001/5173,
 * or desktop 6080 / editor 8080). Keeps editor, desktop, Supabase, and a
 * spare Next slot so all surfaces stay routable.
 */
export function vercelExposedPortsForPublicPort(publicPort: number): number[] {
  const companions = [8080, 6080, 54321, 3000];
  const rest = companions.filter((port) => port !== publicPort);
  return [publicPort, ...rest].slice(0, 4);
}
