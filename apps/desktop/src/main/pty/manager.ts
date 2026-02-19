import * as pty from "node-pty";
import type { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc-channels";

interface PtyRecord {
  process: pty.IPty;
  ptyId: string;
  buffer: string;
  flushPending: boolean;
}

const ptyMap = new Map<string, PtyRecord>();

export function spawnPty(
  ptyId: string,
  cwd: string,
  cols: number,
  rows: number,
  env: Record<string, string>,
  win: BrowserWindow,
): void {
  if (ptyMap.has(ptyId)) return;

  const shell =
    process.platform === "win32"
      ? "powershell.exe"
      : (process.env["SHELL"] ?? "/bin/bash");

  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-256color",
    cwd,
    cols,
    rows,
    env: Object.fromEntries(
      Object.entries({ ...process.env, ...env }).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    ),
  });

  const record: PtyRecord = {
    process: ptyProcess,
    ptyId,
    buffer: "",
    flushPending: false,
  };

  ptyProcess.onData((data: string) => {
    record.buffer += data;
    if (!record.flushPending) {
      record.flushPending = true;
      setImmediate(() => {
        if (!win.isDestroyed() && record.buffer.length > 0) {
          win.webContents.send(IPC_CHANNELS.PTY_DATA, ptyId, record.buffer);
        }
        record.buffer = "";
        record.flushPending = false;
      });
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    if (record.buffer.length > 0 && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.PTY_DATA, ptyId, record.buffer);
      record.buffer = "";
    }
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.PTY_EXIT, ptyId, exitCode);
    }
    ptyMap.delete(ptyId);
  });

  ptyMap.set(ptyId, record);
}

export function writePty(ptyId: string, data: string): void {
  ptyMap.get(ptyId)?.process.write(data);
}

export function resizePty(ptyId: string, cols: number, rows: number): void {
  ptyMap.get(ptyId)?.process.resize(cols, rows);
}

export function killPty(ptyId: string): void {
  const record = ptyMap.get(ptyId);
  if (record) {
    record.process.kill();
    ptyMap.delete(ptyId);
  }
}

export function killAllPtys(): void {
  for (const record of ptyMap.values()) {
    record.process.kill();
  }
  ptyMap.clear();
}
