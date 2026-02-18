export const IPC_CHANNELS = {
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
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
