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
  onPtyData: (callback: (ptyId: string, data: string) => void) => () => void;
  onPtyExit: (callback: (ptyId: string, code: number) => void) => () => void;

  sessionCreate: (opts: CreateSessionOptions) => Promise<Session>;
  sessionList: () => Promise<Session[]>;
  sessionDelete: (sessionId: string) => Promise<void>;
  sessionGet: (sessionId: string) => Promise<Session | null>;

  tabCreate: (opts: CreateTabOptions) => Promise<TerminalTab>;
  tabClose: (sessionId: string, tabId: string) => Promise<void>;
  tabSendMessage: (sessionId: string, tabId: string, message: string) => void;

  gitStatus: (repoPath: string) => Promise<GitStatusResult>;
  gitStage: (repoPath: string, files: string[]) => Promise<void>;
  gitUnstage: (repoPath: string, files: string[]) => Promise<void>;
  gitCommit: (repoPath: string, message: string) => Promise<void>;
  gitDiffStaged: (repoPath: string) => Promise<RawFilePatch[]>;
  gitDiffUnstaged: (repoPath: string) => Promise<RawFilePatch[]>;
  gitWatchStart: (repoPath: string) => Promise<void>;
  gitWatchStop: (repoPath: string) => Promise<void>;
  onGitChanged: (callback: (repoPath: string) => void) => () => void;

  openDirectory: () => Promise<string | null>;

  openInFinder: (path: string) => void;
  openExternal: (url: string) => void;
}
