export interface PtySpawnOptions {
  ptyId: string;
  cwd: string;
  cols: number;
  rows: number;
  env?: Record<string, string>;
}

export interface AgentSpawnOptions {
  agentId: string;
  repoPath: string;
  branchName: string;
  baseBranch: string;
  prompt: string;
  model?: string;
  useWorktree?: boolean;
}

export interface WorktreeAddOptions {
  repoPath: string;
  agentId: string;
  branchName: string;
  baseBranch: string;
}

export type AgentStatus = "idle" | "running" | "success" | "error" | "killed";

export interface AgentInfo {
  agentId: string;
  repoPath: string;
  branchName: string;
  worktreePath: string;
  ptyId: string;
  status: AgentStatus;
  startedAt: number;
  prompt: string;
}

export interface DiffLine {
  type: "context" | "addition" | "deletion";
  content: string;
  oldLineNo: number | null;
  newLineNo: number | null;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffFile {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  hunks: DiffHunk[];
}

export interface ElectronAPI {
  // PTY
  ptySpawn: (opts: PtySpawnOptions) => Promise<void>;
  ptyInput: (ptyId: string, data: string) => void;
  ptyResize: (ptyId: string, cols: number, rows: number) => Promise<void>;
  ptyKill: (ptyId: string) => Promise<void>;
  onPtyData: (callback: (ptyId: string, data: string) => void) => () => void;
  onPtyExit: (callback: (ptyId: string, code: number) => void) => () => void;

  // Agents
  agentSpawn: (opts: AgentSpawnOptions) => Promise<string>;
  agentKill: (agentId: string) => Promise<void>;
  agentList: () => Promise<AgentInfo[]>;
  onAgentStatus: (
    callback: (agentId: string, status: AgentStatus) => void,
  ) => () => void;

  // Git
  gitWorktreeAdd: (opts: WorktreeAddOptions) => Promise<string>;
  gitWorktreeRemove: (worktreePath: string) => Promise<void>;
  gitDiff: (repoPath: string, branch?: string) => Promise<DiffFile[]>;
  gitBranches: (repoPath: string) => Promise<string[]>;

  // Dialog
  openDirectory: () => Promise<string | null>;

  // Shell
  openInFinder: (path: string) => void;
  openExternal: (url: string) => void;
}
