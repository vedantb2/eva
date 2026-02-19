export const IPC_CHANNELS = {
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
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
