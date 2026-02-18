"use strict";
const electron = require("electron");
const IPC_CHANNELS = {
  // PTY / Terminal
  PTY_SPAWN: "pty:spawn",
  PTY_INPUT: "pty:input",
  PTY_RESIZE: "pty:resize",
  PTY_KILL: "pty:kill",
  PTY_DATA: "pty:data",
  PTY_EXIT: "pty:exit",
  // Agent lifecycle
  AGENT_SPAWN: "agent:spawn",
  AGENT_KILL: "agent:kill",
  AGENT_LIST: "agent:list",
  AGENT_STATUS: "agent:status",
  // Git
  GIT_WORKTREE_ADD: "git:worktree:add",
  GIT_WORKTREE_REMOVE: "git:worktree:remove",
  GIT_DIFF: "git:diff",
  GIT_BRANCHES: "git:branches",
  // Dialog
  DIALOG_OPEN_DIRECTORY: "dialog:openDirectory",
  // Shell
  OPEN_IN_FINDER: "shell:openInFinder",
  OPEN_EXTERNAL: "shell:openExternal",
};
const api = {
  // PTY
  ptySpawn: (opts) => electron.ipcRenderer.invoke(IPC_CHANNELS.PTY_SPAWN, opts),
  ptyInput: (ptyId, data) =>
    electron.ipcRenderer.send(IPC_CHANNELS.PTY_INPUT, ptyId, data),
  ptyResize: (ptyId, cols, rows) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.PTY_RESIZE, ptyId, cols, rows),
  ptyKill: (ptyId) => electron.ipcRenderer.invoke(IPC_CHANNELS.PTY_KILL, ptyId),
  onPtyData: (callback) => {
    const handler = (_, ptyId, data) => callback(ptyId, data);
    electron.ipcRenderer.on(IPC_CHANNELS.PTY_DATA, handler);
    return () => electron.ipcRenderer.off(IPC_CHANNELS.PTY_DATA, handler);
  },
  onPtyExit: (callback) => {
    const handler = (_, ptyId, code) => callback(ptyId, code);
    electron.ipcRenderer.on(IPC_CHANNELS.PTY_EXIT, handler);
    return () => electron.ipcRenderer.off(IPC_CHANNELS.PTY_EXIT, handler);
  },
  // Agents
  agentSpawn: (opts) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.AGENT_SPAWN, opts),
  agentKill: (agentId) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.AGENT_KILL, agentId),
  agentList: () => electron.ipcRenderer.invoke(IPC_CHANNELS.AGENT_LIST),
  onAgentStatus: (callback) => {
    const handler = (_, agentId, status) => callback(agentId, status);
    electron.ipcRenderer.on(IPC_CHANNELS.AGENT_STATUS, handler);
    return () => electron.ipcRenderer.off(IPC_CHANNELS.AGENT_STATUS, handler);
  },
  // Git
  gitWorktreeAdd: (opts) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_WORKTREE_ADD, opts),
  gitWorktreeRemove: (worktreePath) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_WORKTREE_REMOVE, worktreePath),
  gitDiff: (repoPath, branch) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_DIFF, repoPath, branch),
  gitBranches: (repoPath) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_BRANCHES, repoPath),
  // Dialog
  openDirectory: () =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),
  // Shell
  openInFinder: (path) =>
    electron.ipcRenderer.send(IPC_CHANNELS.OPEN_IN_FINDER, path),
  openExternal: (url) =>
    electron.ipcRenderer.send(IPC_CHANNELS.OPEN_EXTERNAL, url),
};
electron.contextBridge.exposeInMainWorld("electronAPI", api);
