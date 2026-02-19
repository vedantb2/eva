import { simpleGit } from "simple-git";
import type {
  GitStatusResult,
  GitFileStatus,
  RawFilePatch,
} from "../../preload/types";

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

export async function push(repoPath: string): Promise<void> {
  const git = simpleGit(repoPath);
  await git.push();
}

function splitPatchByFile(raw: string): RawFilePatch[] {
  if (!raw.trim()) return [];
  const blocks = raw.split(/(?=^diff --git )/m).filter(Boolean);
  const patches: RawFilePatch[] = [];

  for (const block of blocks) {
    const pathMatch = /b\/(.+)$/.exec(block.split("\n")[0] ?? "");
    const path = pathMatch?.[1] ?? "";

    let status: RawFilePatch["status"] = "modified";
    if (block.includes("\nnew file mode")) status = "added";
    else if (block.includes("\ndeleted file mode")) status = "deleted";
    else if (block.includes("\nrename to ")) status = "renamed";

    patches.push({ path, status, patch: block });
  }

  return patches;
}

export async function getStagedDiff(repoPath: string): Promise<RawFilePatch[]> {
  const git = simpleGit(repoPath);
  const raw = await git.diff(["--cached", "--unified=3"]);
  return splitPatchByFile(raw);
}

export async function getUnstagedDiff(
  repoPath: string,
): Promise<RawFilePatch[]> {
  const git = simpleGit(repoPath);
  const raw = await git.diff(["--unified=3"]);
  return splitPatchByFile(raw);
}
