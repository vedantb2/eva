import type { DiffFile, DiffHunk, DiffLine } from "../../preload/types";

export function parseDiff(raw: string): DiffFile[] {
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
