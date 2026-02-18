import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { mkdirSync } from "fs";

const execFileAsync = promisify(execFile);

function getWorktreePath(repoPath: string, agentId: string): string {
  return join(repoPath, ".worktrees", agentId);
}

export async function addWorktree(
  repoPath: string,
  agentId: string,
  branchName: string,
  baseBranch: string,
): Promise<string> {
  const worktreePath = getWorktreePath(repoPath, agentId);
  mkdirSync(join(repoPath, ".worktrees"), { recursive: true });

  await execFileAsync(
    "git",
    ["worktree", "add", "-b", branchName, worktreePath, baseBranch],
    { cwd: repoPath },
  );

  return worktreePath;
}

export async function removeWorktree(worktreePath: string): Promise<void> {
  await execFileAsync("git", ["worktree", "remove", "--force", worktreePath]);
}

export async function listWorktrees(repoPath: string): Promise<string[]> {
  const { stdout } = await execFileAsync(
    "git",
    ["worktree", "list", "--porcelain"],
    { cwd: repoPath },
  );

  return stdout
    .split("\n\n")
    .map((block) => {
      const match = /^worktree (.+)$/m.exec(block);
      return match?.[1] ?? null;
    })
    .filter((p): p is string => p !== null);
}
