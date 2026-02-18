import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/ipc-channels";
import type {
  ElectronAPI,
  PtySpawnOptions,
  AgentSpawnOptions,
  AgentStatus,
  WorktreeAddOptions,
} from "./types";

const api: ElectronAPI = {
  // PTY
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

  // Agents
  agentSpawn: (opts: AgentSpawnOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.AGENT_SPAWN, opts),

  agentKill: (agentId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.AGENT_KILL, agentId),

  agentList: () => ipcRenderer.invoke(IPC_CHANNELS.AGENT_LIST),

  onAgentStatus: (callback) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      agentId: string,
      status: AgentStatus,
    ) => callback(agentId, status);
    ipcRenderer.on(IPC_CHANNELS.AGENT_STATUS, handler);
    return () => ipcRenderer.off(IPC_CHANNELS.AGENT_STATUS, handler);
  },

  // Git
  gitWorktreeAdd: (opts: WorktreeAddOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_WORKTREE_ADD, opts),

  gitWorktreeRemove: (worktreePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_WORKTREE_REMOVE, worktreePath),

  gitDiff: (repoPath: string, branch?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_DIFF, repoPath, branch),

  gitBranches: (repoPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_BRANCHES, repoPath),

  // Dialog
  openDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),

  // Shell
  openInFinder: (path: string) =>
    ipcRenderer.send(IPC_CHANNELS.OPEN_IN_FINDER, path),

  openExternal: (url: string) =>
    ipcRenderer.send(IPC_CHANNELS.OPEN_EXTERNAL, url),
};

contextBridge.exposeInMainWorld("electronAPI", api);
