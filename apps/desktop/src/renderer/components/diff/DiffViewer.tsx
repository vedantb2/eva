import { IconFilePlus, IconFileMinus, IconFile } from "@tabler/icons-react";
import type { DiffFile, DiffHunk, DiffLine } from "../../../preload/types";

interface DiffViewerProps {
  files: DiffFile[];
}

export function DiffViewer({ files }: DiffViewerProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No changes yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {files.map((file) => (
        <DiffFileBlock key={file.path} file={file} />
      ))}
    </div>
  );
}

function DiffFileBlock({ file }: { file: DiffFile }) {
  const Icon =
    file.status === "added"
      ? IconFilePlus
      : file.status === "deleted"
        ? IconFileMinus
        : IconFile;

  const iconColor =
    file.status === "added"
      ? "text-green-400"
      : file.status === "deleted"
        ? "text-red-400"
        : "text-muted-foreground";

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
        <Icon size={14} className={iconColor} />
        <span className="text-xs font-mono text-foreground">{file.path}</span>
        <span className="ml-auto text-xs text-muted-foreground capitalize">
          {file.status}
        </span>
      </div>
      <div className="overflow-x-auto">
        {file.hunks.map((hunk, i) => (
          <DiffHunkBlock key={i} hunk={hunk} />
        ))}
      </div>
    </div>
  );
}

function DiffHunkBlock({ hunk }: { hunk: DiffHunk }) {
  return (
    <div>
      <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-mono border-b border-border">
        {hunk.header}
      </div>
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {hunk.lines.map((line, i) => (
            <DiffLineRow key={i} line={line} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DiffLineRow({ line }: { line: DiffLine }) {
  const bgClass =
    line.type === "addition"
      ? "bg-green-500/10"
      : line.type === "deletion"
        ? "bg-red-500/10"
        : "";

  const textClass =
    line.type === "addition"
      ? "text-green-400"
      : line.type === "deletion"
        ? "text-red-400"
        : "text-muted-foreground";

  const prefix =
    line.type === "addition" ? "+" : line.type === "deletion" ? "-" : " ";

  return (
    <tr className={bgClass}>
      <td className="w-10 px-2 py-0.5 text-right text-muted-foreground/50 select-none border-r border-border">
        {line.oldLineNo ?? ""}
      </td>
      <td className="w-10 px-2 py-0.5 text-right text-muted-foreground/50 select-none border-r border-border">
        {line.newLineNo ?? ""}
      </td>
      <td className="w-5 px-1 py-0.5 text-center select-none">
        <span className={textClass}>{prefix}</span>
      </td>
      <td className={`px-2 py-0.5 whitespace-pre ${textClass}`}>
        {line.content}
      </td>
    </tr>
  );
}
