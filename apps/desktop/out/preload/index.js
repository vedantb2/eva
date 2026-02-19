"use strict";
const electron = require("electron");
const IPC_CHANNELS = {
  PTY_SPAWN: "pty:spawn",
  PTY_INPUT: "pty:input",
  PTY_RESIZE: "pty:resize",
  PTY_KILL: "pty:kill",
  PTY_DATA: "pty:data",
  PTY_EXIT: "pty:exit",
  SESSION_CREATE: "session:create",
  SESSION_LIST: "session:list",
  SESSION_DELETE: "session:delete",
  SESSION_GET: "session:get",
  SESSION_RESTORE: "session:restore",
  SESSION_RECENT_REPOS: "session:recentRepos",
  TAB_CREATE: "tab:create",
  TAB_CLOSE: "tab:close",
  TAB_SEND_MESSAGE: "tab:sendMessage",
  PREFERENCES_GET: "preferences:get",
  PREFERENCES_SET: "preferences:set",
  GIT_STATUS: "git:status",
  GIT_STAGE: "git:stage",
  GIT_UNSTAGE: "git:unstage",
  GIT_COMMIT: "git:commit",
  GIT_PUSH: "git:push",
  GIT_DIFF_STAGED: "git:diffStaged",
  GIT_DIFF_UNSTAGED: "git:diffUnstaged",
  GIT_WATCH_START: "git:watchStart",
  GIT_WATCH_STOP: "git:watchStop",
  GIT_WATCH_CHANGED: "git:watchChanged",
  DIALOG_OPEN_DIRECTORY: "dialog:openDirectory",
  OPEN_IN_FINDER: "shell:openInFinder",
  OPEN_EXTERNAL: "shell:openExternal",
};
const ptyDataListeners = /* @__PURE__ */ new Map();
electron.ipcRenderer.on(IPC_CHANNELS.PTY_DATA, (_, ptyId, data) => {
  ptyDataListeners.get(ptyId)?.(data);
});
const ptyExitListeners = /* @__PURE__ */ new Map();
electron.ipcRenderer.on(IPC_CHANNELS.PTY_EXIT, (_, ptyId, code) => {
  ptyExitListeners.get(ptyId)?.(code);
});
const api = {
  ptySpawn: (opts) => electron.ipcRenderer.invoke(IPC_CHANNELS.PTY_SPAWN, opts),
  ptyInput: (ptyId, data) =>
    electron.ipcRenderer.send(IPC_CHANNELS.PTY_INPUT, ptyId, data),
  ptyResize: (ptyId, cols, rows) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.PTY_RESIZE, ptyId, cols, rows),
  ptyKill: (ptyId) => electron.ipcRenderer.invoke(IPC_CHANNELS.PTY_KILL, ptyId),
  onPtyData: (ptyId, callback) => {
    ptyDataListeners.set(ptyId, callback);
    return () => {
      ptyDataListeners.delete(ptyId);
    };
  },
  onPtyExit: (ptyId, callback) => {
    ptyExitListeners.set(ptyId, callback);
    return () => {
      ptyExitListeners.delete(ptyId);
    };
  },
  sessionCreate: (opts) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE, opts),
  sessionList: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST),
  sessionGet: (sessionId) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET, sessionId),
  sessionDelete: (sessionId) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.SESSION_DELETE, sessionId),
  sessionRestore: (sessionId) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.SESSION_RESTORE, sessionId),
  recentRepos: (limit) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.SESSION_RECENT_REPOS, limit),
  tabCreate: (opts) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.TAB_CREATE, opts),
  tabClose: (sessionId, tabId) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.TAB_CLOSE, sessionId, tabId),
  tabSendMessage: (sessionId, tabId, message) =>
    electron.ipcRenderer.send(
      IPC_CHANNELS.TAB_SEND_MESSAGE,
      sessionId,
      tabId,
      message,
    ),
  gitStatus: (repoPath) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_STATUS, repoPath),
  gitStage: (repoPath, files) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE, repoPath, files),
  gitUnstage: (repoPath, files) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE, repoPath, files),
  gitCommit: (repoPath, message) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, repoPath, message),
  gitPush: (repoPath) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_PUSH, repoPath),
  gitDiffStaged: (repoPath) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_DIFF_STAGED, repoPath),
  gitDiffUnstaged: (repoPath) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_DIFF_UNSTAGED, repoPath),
  gitWatchStart: (repoPath) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_WATCH_START, repoPath),
  gitWatchStop: (repoPath) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.GIT_WATCH_STOP, repoPath),
  onGitChanged: (callback) => {
    const handler = (_, repoPath) => callback(repoPath);
    electron.ipcRenderer.on(IPC_CHANNELS.GIT_WATCH_CHANGED, handler);
    return () =>
      electron.ipcRenderer.off(IPC_CHANNELS.GIT_WATCH_CHANGED, handler);
  },
  preferencesGet: (key) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.PREFERENCES_GET, key),
  preferencesSet: (key, value) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.PREFERENCES_SET, key, value),
  openDirectory: () =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),
  openInFinder: (path) =>
    electron.ipcRenderer.send(IPC_CHANNELS.OPEN_IN_FINDER, path),
  openExternal: (url) =>
    electron.ipcRenderer.send(IPC_CHANNELS.OPEN_EXTERNAL, url),
};
electron.contextBridge.exposeInMainWorld("electronAPI", api);
