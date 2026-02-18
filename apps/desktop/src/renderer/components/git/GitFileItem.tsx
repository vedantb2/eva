import { useState, useCallback } from "react";
import { Button } from "@conductor/ui";
import {
  IconPlus,
  IconMinus,
  IconFile,
  IconFilePlus,
  IconFileMinus,
  IconFileUnknown,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { DiffViewer } from "../diff/DiffViewer";
import type { GitFileStatus, DiffFile } from "../../../preload/types";

interface GitFileItemProps {
  file: GitFileStatus;
  repoPath: string;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
}

function getStatusIcon(file: GitFileStatus) {
  const status = file.staged ? file.indexStatus : file.workTreeStatus;
  switch (status) {
    case "A":
    case "?":
      return { Icon: IconFilePlus, color: "text-green-400", label: "A" };
    case "D":
      return { Icon: IconFileMinus, color: "text-red-400", label: "D" };
    case "M":
      return { Icon: IconFile, color: "text-yellow-400", label: "M" };
    case "R":
      return { Icon: IconFile, color: "text-blue-400", label: "R" };
    default:
      return {
        Icon: IconFileUnknown,
        color: "text-muted-foreground",
        label: "?",
      };
  }
}

export function GitFileItem({
  file,
  repoPath,
  onStage,
  onUnstage,
}: GitFileItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const { Icon, color, label } = getStatusIcon(file);

  const toggleExpand = useCallback(async () => {
    if (!expanded) {
      const fetcher = file.staged
        ? window.electronAPI.gitDiffStaged
        : window.electronAPI.gitDiffUnstaged;
      const allDiffs = await fetcher(repoPath);
      const fileDiff = allDiffs.filter((d) => d.path === file.path);
      setDiffFiles(fileDiff);
    }
    setExpanded((prev) => !prev);
  }, [expanded, file.staged, file.path, repoPath]);

  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1 hover:bg-accent/50 rounded group">
        <button
          className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground"
          onClick={toggleExpand}
        >
          {expanded ? (
            <IconChevronDown size={12} />
          ) : (
            <IconChevronRight size={12} />
          )}
        </button>
        <span
          className={`shrink-0 text-[10px] font-mono w-4 text-center ${color}`}
        >
          {label}
        </span>
        <Icon size={12} className={`shrink-0 ${color}`} />
        <span
          className="text-xs font-mono truncate flex-1 cursor-pointer"
          onClick={toggleExpand}
        >
          {file.path}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
          onClick={() =>
            file.staged ? onUnstage(file.path) : onStage(file.path)
          }
          title={file.staged ? "Unstage" : "Stage"}
        >
          {file.staged ? <IconMinus size={12} /> : <IconPlus size={12} />}
        </Button>
      </div>
      {expanded && diffFiles.length > 0 && (
        <div className="ml-6 mr-2 mb-1">
          <DiffViewer files={diffFiles} />
        </div>
      )}
    </div>
  );
}
