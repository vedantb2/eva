export type ToolType = "claude" | "opencode" | "codex" | "shell";

export interface TerminalTab {
  tabId: string;
  sessionId: string;
  ptyId: string;
  tool: ToolType;
  label: string;
  createdAt: number;
}

export interface Session {
  sessionId: string;
  repoPath: string;
  name: string;
  createdAt: number;
  tabs: TerminalTab[];
  activeTabId: string;
}

export interface CreateSessionOptions {
  repoPath: string;
  tool: ToolType;
  initialMessage?: string;
}

export interface CreateTabOptions {
  sessionId: string;
  tool: ToolType;
}

export interface PtySpawnOptions {
  ptyId: string;
  cwd: string;
  cols: number;
  rows: number;
  env?: Record<string, string>;
}

export interface GitFileStatus {
  path: string;
  indexStatus: string;
  workTreeStatus: string;
  staged: boolean;
}

export interface GitStatusResult {
  files: GitFileStatus[];
  branch: string;
  ahead: number;
  behind: number;
}

export interface RawFilePatch {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  patch: string;
}

export interface ElectronAPI {
  ptySpawn: (opts: PtySpawnOptions) => Promise<void>;
  ptyInput: (ptyId: string, data: string) => void;
  ptyResize: (ptyId: string, cols: number, rows: number) => Promise<void>;
  ptyKill: (ptyId: string) => Promise<void>;
  onPtyData: (ptyId: string, callback: (data: string) => void) => () => void;
  onPtyExit: (ptyId: string, callback: (code: number) => void) => () => void;

  sessionCreate: (opts: CreateSessionOptions) => Promise<Session>;
  sessionList: () => Promise<Session[]>;
  sessionDelete: (sessionId: string) => Promise<void>;
  sessionGet: (sessionId: string) => Promise<Session | null>;
  sessionRestore: (sessionId: string) => Promise<Session | null>;
  recentRepos: (limit: number) => Promise<string[]>;

  tabCreate: (opts: CreateTabOptions) => Promise<TerminalTab>;
  tabClose: (sessionId: string, tabId: string) => Promise<void>;
  tabSendMessage: (sessionId: string, tabId: string, message: string) => void;
  tabRespawn: (sessionId: string, tabId: string) => Promise<void>;

  gitStatus: (repoPath: string) => Promise<GitStatusResult>;
  gitStage: (repoPath: string, files: string[]) => Promise<void>;
  gitUnstage: (repoPath: string, files: string[]) => Promise<void>;
  gitCommit: (repoPath: string, message: string) => Promise<void>;
  gitPush: (repoPath: string) => Promise<void>;
  gitDiffFile: (
    repoPath: string,
    filePath: string,
    staged: boolean,
  ) => Promise<string>;
  gitDiffStaged: (repoPath: string) => Promise<RawFilePatch[]>;
  gitDiffUnstaged: (repoPath: string) => Promise<RawFilePatch[]>;
  gitWatchStart: (repoPath: string) => Promise<void>;
  gitWatchStop: (repoPath: string) => Promise<void>;
  onGitChanged: (callback: (repoPath: string) => void) => () => void;

  preferencesGet: (key: string) => Promise<string | null>;
  preferencesSet: (key: string, value: string) => Promise<void>;

  openDirectory: () => Promise<string | null>;

  openInFinder: (path: string) => void;
  openExternal: (url: string) => void;
}
