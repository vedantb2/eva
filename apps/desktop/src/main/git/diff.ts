import { execFile } from "child_process";
import { promisify } from "util";
import type { DiffFile, DiffHunk, DiffLine } from "../../preload/types";

const execFileAsync = promisify(execFile);

export async function getDiff(
  repoPath: string,
  branch?: string,
): Promise<DiffFile[]> {
  const args = branch
    ? ["diff", `main...${branch}`, "--unified=3"]
    : ["diff", "--unified=3"];

  const { stdout } = await execFileAsync("git", args, { cwd: repoPath });
  return parseDiff(stdout);
}

export async function getBranches(repoPath: string): Promise<string[]> {
  const { stdout } = await execFileAsync(
    "git",
    ["branch", "--format=%(refname:short)"],
    { cwd: repoPath },
  );
  return stdout
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);
}

function parseDiff(raw: string): DiffFile[] {
  const files: DiffFile[] = [];
  const fileBlocks = raw.split(/^diff --git /m).filter(Boolean);

  for (const block of fileBlocks) {
    const lines = block.split("\n");
    const headerLine = lines[0] ?? "";
    const pathMatch = /b\/(.+)$/.exec(headerLine);
    const path = pathMatch?.[1] ?? headerLine;

    let status: DiffFile["status"] = "modified";
    if (block.includes("\nnew file mode")) status = "added";
    else if (block.includes("\ndeleted file mode")) status = "deleted";
    else if (block.includes("\nrename to ")) status = "renamed";

    const hunks = parseHunks(lines.slice(4));
    files.push({ path, status, hunks });
  }

  return files;
}

function parseHunks(lines: string[]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let current: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    const hunkHeader = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunkHeader) {
      current = { header: line, lines: [] };
      hunks.push(current);
      oldLine = parseInt(hunkHeader[1] ?? "0", 10);
      newLine = parseInt(hunkHeader[2] ?? "0", 10);
      continue;
    }

    if (!current) continue;

    if (line.startsWith("+")) {
      const diffLine: DiffLine = {
        type: "addition",
        content: line.slice(1),
        oldLineNo: null,
        newLineNo: newLine++,
      };
      current.lines.push(diffLine);
    } else if (line.startsWith("-")) {
      const diffLine: DiffLine = {
        type: "deletion",
        content: line.slice(1),
        oldLineNo: oldLine++,
        newLineNo: null,
      };
      current.lines.push(diffLine);
    } else if (line.startsWith(" ")) {
      const diffLine: DiffLine = {
        type: "context",
        content: line.slice(1),
        oldLineNo: oldLine++,
        newLineNo: newLine++,
      };
      current.lines.push(diffLine);
    }
  }

  return hunks;
}
