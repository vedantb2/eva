import { ipcMain, shell, dialog, BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc-channels";
import { spawnPty, writePty, resizePty, killPty } from "../pty/manager";
import {
  createSession,
  getSession,
  listSessions,
  deleteSession,
  removeTab,
  touchSession,
} from "../session/store";
import { spawnTab, respawnTab } from "../session/tab-spawner";
import {
  getStatus,
  stageFiles,
  unstageFiles,
  commit,
  push,
  getFileDiff,
  getStagedDiff,
  getUnstagedDiff,
} from "../git/operations";
import { startWatching, stopWatching } from "../git/watcher";
import {
  getPreference,
  setPreference,
  selectRecentRepos,
  selectSessionRepoPath,
} from "../db/queries";
import type {
  PtySpawnOptions,
  CreateSessionOptions,
  CreateTabOptions,
} from "../../preload/types";

export function registerHandlers(win: BrowserWindow): void {
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

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(
    IPC_CHANNELS.SESSION_CREATE,
    (_event, opts: CreateSessionOptions) => {
      const session = createSession(opts.repoPath);
      const tab = spawnTab(
        win,
        session.sessionId,
        opts.repoPath,
        opts.tool,
        opts.initialMessage,
      );
      startWatching(opts.repoPath, win);
      if (tab) {
        session.tabs.push(tab);
        session.activeTabId = tab.tabId;
      }
      return session;
    },
  );

  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, () => {
    return listSessions();
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET, (_event, sessionId: string) => {
    return getSession(sessionId);
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, (_event, sessionId: string) => {
    const session = getSession(sessionId);
    if (session) {
      for (const tab of session.tabs) {
        killPty(tab.ptyId);
      }
      stopWatching(session.repoPath);
    }
    deleteSession(sessionId);
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_RESTORE, (_event, sessionId: string) => {
    const session = getSession(sessionId);
    if (!session) return null;

    touchSession(sessionId);

    for (const tab of session.tabs) {
      respawnTab(win, tab, session.repoPath);
    }

    startWatching(session.repoPath, win);

    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_RECENT_REPOS, (_event, limit: number) => {
    return selectRecentRepos(limit);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_CREATE, (_event, opts: CreateTabOptions) => {
    const repoPath = selectSessionRepoPath(opts.sessionId);
    if (repoPath === null) return null;
    return spawnTab(win, opts.sessionId, repoPath, opts.tool);
  });

  ipcMain.handle(
    IPC_CHANNELS.TAB_CLOSE,
    (_event, sessionId: string, tabId: string) => {
      const ptyId = removeTab(sessionId, tabId);
      if (ptyId) killPty(ptyId);
    },
  );

  ipcMain.on(
    IPC_CHANNELS.TAB_SEND_MESSAGE,
    (_event, _sessionId: string, tabId: string, message: string) => {
      writePty(`tab-pty-${tabId}`, `${message}\r`);
    },
  );

  ipcMain.handle(IPC_CHANNELS.PREFERENCES_GET, (_event, key: string) => {
    return getPreference(key);
  });

  ipcMain.handle(
    IPC_CHANNELS.PREFERENCES_SET,
    (_event, key: string, value: string) => {
      setPreference(key, value);
    },
  );

  ipcMain.handle(IPC_CHANNELS.GIT_STATUS, async (_event, repoPath: string) => {
    return getStatus(repoPath);
  });

  ipcMain.handle(
    IPC_CHANNELS.GIT_STAGE,
    async (_event, repoPath: string, files: string[]) => {
      await stageFiles(repoPath, files);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_UNSTAGE,
    async (_event, repoPath: string, files: string[]) => {
      await unstageFiles(repoPath, files);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_COMMIT,
    async (_event, repoPath: string, message: string) => {
      await commit(repoPath, message);
    },
  );

  ipcMain.handle(IPC_CHANNELS.GIT_PUSH, async (_event, repoPath: string) => {
    await push(repoPath);
  });

  ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF_FILE,
    async (_event, repoPath: string, filePath: string, staged: boolean) => {
      return getFileDiff(repoPath, filePath, staged);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF_STAGED,
    async (_event, repoPath: string) => {
      return getStagedDiff(repoPath);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF_UNSTAGED,
    async (_event, repoPath: string) => {
      return getUnstagedDiff(repoPath);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_WATCH_START,
    async (_event, repoPath: string) => {
      startWatching(repoPath, win);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_WATCH_STOP,
    async (_event, repoPath: string) => {
      stopWatching(repoPath);
    },
  );

  ipcMain.on(IPC_CHANNELS.OPEN_IN_FINDER, (_event, path: string) => {
    shell.showItemInFolder(path);
  });

  ipcMain.on(IPC_CHANNELS.OPEN_EXTERNAL, (_event, url: string) => {
    shell.openExternal(url);
  });
}
