"use node";

import type { SandboxHandle } from "../_sandbox/provider";
import { defaultTerminalPtyId } from "../_sandbox_runtime/devServer";
import { workspaceDirShell } from "../_sandbox_runtime/helpers";
import { ensureSwapFile } from "../_sandbox_runtime/swap";
import {
  EVA_ENV_FILE,
  tmuxNewSessionWithEvaEnv,
} from "../_sandbox/vercelEnvFile";
import { tmuxSessionName } from "./vercel";

const CONSOLE_LAUNCH_SCRIPT = "/tmp/eva-console-dev.sh";

/**
 * Starts the app dev server inside the Preview Console's shared tmux session
 * so logs stream into the Console pane (not `/tmp/devserver.log`).
 *
 * Safe to call when the browser already attached: send-keys goes into the
 * existing session. Skips when the listen port is already open.
 */
export async function launchDevServerInVercelConsole(
  handle: SandboxHandle,
  ownerKey: string,
  devCommand: string,
  port: number,
): Promise<void> {
  const sessionName = tmuxSessionName(defaultTerminalPtyId(ownerKey));
  const workspace = workspaceDirShell();

  await handle.exec(
    "command -v tmux >/dev/null 2>&1 || sudo dnf install -y tmux >/dev/null 2>&1",
    { cwd: "/", timeoutSeconds: 120 },
  );

  const portBusy = (
    await handle.exec(
      [
        `if command -v ss >/dev/null 2>&1; then ss -ltn 2>/dev/null | grep -q ":${port} " && echo busy && exit 0; fi`,
        `if command -v lsof >/dev/null 2>&1; then lsof -iTCP:${port} -sTCP:LISTEN >/dev/null 2>&1 && echo busy && exit 0; fi`,
        "echo free",
      ].join("; "),
      { cwd: "/", timeoutSeconds: 10 },
    )
  ).output.trim();
  if (portBusy === "busy") {
    console.log(
      `[vercel] launchDevServerInVercelConsole: port ${port} already listening on ${handle.id}; skipping`,
    );
    return;
  }

  // The single Console launcher for sessions, quick tasks and project chats —
  // and the only dev-server gate on paths that never booted through
  // ensureSandboxRunning (preview self-heal on a lazily resumed VM, which comes
  // up with no swap because stop released it). A cold `next dev` compile is the
  // second half of the stack that OOM-killed the Convex backend, so make sure
  // there is swap before starting one. No-op exec when swap is already active.
  await ensureSwapFile(handle);

  const script = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `[ -f ${EVA_ENV_FILE} ] && . ${EVA_ENV_FILE}`,
    `cd ${workspace} 2>/dev/null || cd /vercel/sandbox || cd /tmp/repo || true`,
    `export INIT_CWD="$(pwd)"`,
    // Free the port if a previous background launch left something behind.
    `if command -v fuser >/dev/null 2>&1; then fuser -k ${port}/tcp >/dev/null 2>&1 || true`,
    `elif command -v lsof >/dev/null 2>&1; then for p in $(lsof -ti :${port} 2>/dev/null || true); do kill "$p" 2>/dev/null || true; done`,
    "fi",
    // Cap the dev server's V8 heap: one leaky Next dev compile at ~5.5GB RSS
    // was enough to trigger kernel OOM kills of unrelated processes on a 16GB
    // VM. A clean heap error is the recoverable failure — the preview
    // self-heal (ensureSessionPreviewServices) relaunches the server. Ours
    // goes first so an env- or repo-provided NODE_OPTIONS still wins.
    'export NODE_OPTIONS="--max-old-space-size=6144${NODE_OPTIONS:+ $NODE_OPTIONS}"',
    devCommand,
  ].join("\n");
  await handle.writeFile(CONSOLE_LAUNCH_SCRIPT, script);
  await handle.exec(`chmod +x ${CONSOLE_LAUNCH_SCRIPT}`, {
    cwd: "/",
    timeoutSeconds: 5,
  });

  const hasSession = (
    await handle.exec(
      `tmux has-session -t ${sessionName} >/dev/null 2>&1 && echo yes || echo no`,
      { cwd: "/", timeoutSeconds: 5 },
    )
  ).output.trim();
  if (hasSession !== "yes") {
    await handle.exec(tmuxNewSessionWithEvaEnv(sessionName, workspace), {
      cwd: "/",
      timeoutSeconds: 15,
    });
  }
  // mouse off always — tmux mouse mode breaks Console into history/copy-mode.
  // alternate-screen off keeps output in xterm scrollback (visible scrollbar).
  // status off: the status bar shrinks tmux's scroll region by one row, and
  // xterm only pushes scrolled lines into scrollback when the scroll spans the
  // full viewport — with the bar on, the Console scrollbar never appears.
  await handle.exec(
    `tmux set-option -g mouse off; tmux set-option -t ${sessionName} mouse off; tmux set-option -t ${sessionName} alternate-screen off; tmux set-option -t ${sessionName} status off; tmux set-option -t ${sessionName} history-limit 50000`,
    { cwd: "/", timeoutSeconds: 5 },
  );

  // Run via script path so send-keys needs no shell-escaping of the command.
  await handle.exec(
    `tmux send-keys -t ${sessionName} ${CONSOLE_LAUNCH_SCRIPT} Enter`,
    { cwd: "/", timeoutSeconds: 10 },
  );
  console.log(
    `[vercel] launchDevServerInVercelConsole: started in tmux ${sessionName} on ${handle.id} port=${port}`,
  );
}
