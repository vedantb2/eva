"use node";

import type { Sandbox } from "@vercel/sandbox";
import type { SandboxHandle } from "../_sandbox/provider";

/** Browser WebSockets cannot set headers — pass the interactive token as a query param. */
function buildVercelInteractiveWsUrl(url: string, token: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("token", token);
  return parsed.toString();
}

function tmuxSessionName(ptyInstanceId: string | undefined): string {
  const source =
    ptyInstanceId !== undefined && ptyInstanceId.length > 0
      ? ptyInstanceId
      : "terminal";
  const safe = source.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80);
  return `eva_${safe.length > 0 ? safe : "terminal"}`;
}

/** Ensures Vercel browser terminals attach to one shared pane process. */
export async function ensureVercelSharedTerminal(
  handle: SandboxHandle,
  ptyInstanceId: string | undefined,
): Promise<{ sessionName: string; isNewPty: boolean; initialOutput: string }> {
  const sessionName = tmuxSessionName(ptyInstanceId);
  await handle.exec(
    "command -v tmux >/dev/null 2>&1 || sudo dnf install -y tmux >/dev/null 2>&1",
    { cwd: "/", timeoutSeconds: 120 },
  );
  const existing = await handle.exec(
    `tmux has-session -t ${sessionName} >/dev/null 2>&1 && echo existing || echo missing`,
    { cwd: "/", timeoutSeconds: 5 },
  );
  return {
    sessionName,
    isNewPty: existing.output.trim() !== "existing",
    initialOutput:
      existing.output.trim() === "existing"
        ? (
            await handle.exec(
              `tmux capture-pane -pt ${sessionName} -S -2000 2>/dev/null || true`,
              { cwd: "/", timeoutSeconds: 10 },
            )
          ).output
        : "",
  };
}

/** Opens Vercel's controller-hosted PTY and returns a browser-connectable WebSocket URL. */
export async function connectVercelInteractive(
  sandbox: Sandbox,
  ptySessionId: string,
): Promise<{ wsUrl: string; ptySessionId: string; authToken: string }> {
  const { url, token } = await sandbox.openInteractive();
  return {
    wsUrl: buildVercelInteractiveWsUrl(url, token),
    ptySessionId,
    authToken: token,
  };
}
