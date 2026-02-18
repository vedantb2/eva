import { ipcMain, shell, dialog, BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc-channels";
import { spawnPty, writePty, resizePty, killPty } from "../pty/manager";
import { addWorktree, removeWorktree } from "../git/worktree";
import { getDiff, getBranches } from "../git/diff";
import { spawnAgent, killAgent, listAgents } from "../agent/runner";
import type {
  PtySpawnOptions,
  AgentSpawnOptions,
  WorktreeAddOptions,
} from "../../preload/types";

export function registerHandlers(win: BrowserWindow): void {
  // PTY
  ipcMain.handle(IPC_CHANNELS.PTY_SPAWN, (_event, opts: PtySpawnOptions) => {
    spawnPty(opts.ptyId, opts.cwd, opts.cols, opts.rows, opts.env ?? {}, win);
  });

  ipcMain.on(IPC_CHANNELS.PTY_INPUT, (_event, ptyId: string, data: string) => {
    writePty(ptyId, data);
  });

  ipcMain.handle(
    IPC_CHANNELS.PTY_RESIZE,
    (_event, ptyId: string, cols: number, rows: number) => {
      resizePty(ptyId, cols, rows);
    },
  );

  ipcMain.handle(IPC_CHANNELS.PTY_KILL, (_event, ptyId: string) => {
    killPty(ptyId);
  });

  // Dialog
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // Agents
  ipcMain.handle(
    IPC_CHANNELS.AGENT_SPAWN,
    async (_event, opts: AgentSpawnOptions) => {
      return spawnAgent(
        win,
        opts.agentId,
        opts.repoPath,
        opts.branchName,
        opts.baseBranch,
        opts.prompt,
        opts.model,
        opts.useWorktree,
      );
    },
  );

  ipcMain.handle(IPC_CHANNELS.AGENT_KILL, async (_event, agentId: string) => {
    await killAgent(win, agentId);
  });

  ipcMain.handle(IPC_CHANNELS.AGENT_LIST, () => listAgents());

  // Git
  ipcMain.handle(
    IPC_CHANNELS.GIT_WORKTREE_ADD,
    async (_event, opts: WorktreeAddOptions) => {
      return addWorktree(
        opts.repoPath,
        opts.agentId,
        opts.branchName,
        opts.baseBranch,
      );
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_WORKTREE_REMOVE,
    async (_event, worktreePath: string) => {
      await removeWorktree(worktreePath);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF,
    async (_event, repoPath: string, branch?: string) => {
      return getDiff(repoPath, branch);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_BRANCHES,
    async (_event, repoPath: string) => {
      return getBranches(repoPath);
    },
  );

  // Shell
  ipcMain.on(IPC_CHANNELS.OPEN_IN_FINDER, (_event, path: string) => {
    shell.showItemInFolder(path);
  });

  ipcMain.on(IPC_CHANNELS.OPEN_EXTERNAL, (_event, url: string) => {
    shell.openExternal(url);
  });
}
