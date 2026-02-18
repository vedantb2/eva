import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/ipc-channels";
import type {
  ElectronAPI,
  PtySpawnOptions,
  CreateSessionOptions,
  CreateTabOptions,
} from "./types";

const api: ElectronAPI = {
  ptySpawn: (opts: PtySpawnOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.PTY_SPAWN, opts),

  ptyInput: (ptyId: string, data: string) =>
    ipcRenderer.send(IPC_CHANNELS.PTY_INPUT, ptyId, data),

  ptyResize: (ptyId: string, cols: number, rows: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.PTY_RESIZE, ptyId, cols, rows),

  ptyKill: (ptyId: string) => ipcRenderer.invoke(IPC_CHANNELS.PTY_KILL, ptyId),

  onPtyData: (callback) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      ptyId: string,
      data: string,
    ) => callback(ptyId, data);
    ipcRenderer.on(IPC_CHANNELS.PTY_DATA, handler);
    return () => ipcRenderer.off(IPC_CHANNELS.PTY_DATA, handler);
  },

  onPtyExit: (callback) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      ptyId: string,
      code: number,
    ) => callback(ptyId, code);
    ipcRenderer.on(IPC_CHANNELS.PTY_EXIT, handler);
    return () => ipcRenderer.off(IPC_CHANNELS.PTY_EXIT, handler);
  },

  sessionCreate: (opts: CreateSessionOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE, opts),

  sessionList: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST),

  sessionGet: (sessionId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET, sessionId),

  sessionDelete: (sessionId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_DELETE, sessionId),

  tabCreate: (opts: CreateTabOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.TAB_CREATE, opts),

  tabClose: (sessionId: string, tabId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.TAB_CLOSE, sessionId, tabId),

  tabSendMessage: (sessionId: string, tabId: string, message: string) =>
    ipcRenderer.send(IPC_CHANNELS.TAB_SEND_MESSAGE, sessionId, tabId, message),

  gitStatus: (repoPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STATUS, repoPath),

  gitStage: (repoPath: string, files: string[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE, repoPath, files),

  gitUnstage: (repoPath: string, files: string[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE, repoPath, files),

  gitCommit: (repoPath: string, message: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, repoPath, message),

  gitDiffStaged: (repoPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_DIFF_STAGED, repoPath),

  gitDiffUnstaged: (repoPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_DIFF_UNSTAGED, repoPath),

  gitWatchStart: (repoPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_WATCH_START, repoPath),

  gitWatchStop: (repoPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_WATCH_STOP, repoPath),

  onGitChanged: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, repoPath: string) =>
      callback(repoPath);
    ipcRenderer.on(IPC_CHANNELS.GIT_WATCH_CHANGED, handler);
    return () => ipcRenderer.off(IPC_CHANNELS.GIT_WATCH_CHANGED, handler);
  },

  openDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),

  openInFinder: (path: string) =>
    ipcRenderer.send(IPC_CHANNELS.OPEN_IN_FINDER, path),

  openExternal: (url: string) =>
    ipcRenderer.send(IPC_CHANNELS.OPEN_EXTERNAL, url),
};

contextBridge.exposeInMainWorld("electronAPI", api);
