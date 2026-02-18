import { simpleGit } from "simple-git";
import type {
  GitStatusResult,
  GitFileStatus,
  DiffFile,
} from "../../preload/types";
import { parseDiff } from "./diff";

export async function getStatus(repoPath: string): Promise<GitStatusResult> {
  const git = simpleGit(repoPath);
  const status = await git.status();

  const files: GitFileStatus[] = status.files.map((f) => ({
    path: f.path,
    indexStatus: f.index ?? " ",
    workTreeStatus: f.working_dir ?? " ",
    staged: f.index !== " " && f.index !== "?",
  }));

  return {
    files,
    branch: status.current ?? "",
    ahead: status.ahead,
    behind: status.behind,
  };
}

export async function stageFiles(
  repoPath: string,
  files: string[],
): Promise<void> {
  const git = simpleGit(repoPath);
  await git.add(files);
}

export async function unstageFiles(
  repoPath: string,
  files: string[],
): Promise<void> {
  const git = simpleGit(repoPath);
  await git.reset(["HEAD", "--", ...files]);
}

export async function commit(repoPath: string, message: string): Promise<void> {
  const git = simpleGit(repoPath);
  await git.commit(message);
}

export async function getStagedDiff(repoPath: string): Promise<DiffFile[]> {
  const git = simpleGit(repoPath);
  const raw = await git.diff(["--cached", "--unified=3"]);
  return parseDiff(raw);
}

export async function getUnstagedDiff(repoPath: string): Promise<DiffFile[]> {
  const git = simpleGit(repoPath);
  const raw = await git.diff(["--unified=3"]);
  return parseDiff(raw);
}
