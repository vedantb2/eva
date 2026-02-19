import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import {
  Button,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@conductor/ui";
import {
  IconGitBranch,
  IconRefresh,
  IconChevronRight,
  IconChevronLeft,
  IconPlus,
  IconMinus,
  IconArrowUp,
  IconEye,
} from "@tabler/icons-react";
import { GitFileItem } from "./GitFileItem";
import { useDiffTabContext } from "../../contexts/DiffTabContext";
import type { GitStatusResult, GitFileStatus } from "../../../preload/types";

interface GitPanelProps {
  repoPath: string;
}

export const GitPanel = memo(function GitPanel({ repoPath }: GitPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState<GitStatusResult | null>(null);
  const [commitMsg, setCommitMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const { openDiffTab, openAllDiffsTab } = useDiffTabContext();

  const refreshInFlight = useRef(false);
  const refreshQueued = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) {
      refreshQueued.current = true;
      return;
    }
    refreshInFlight.current = true;
    setLoading(true);
    try {
      const result = await window.electronAPI.gitStatus(repoPath);
      setStatus(result);
    } finally {
      setLoading(false);
      refreshInFlight.current = false;
      if (refreshQueued.current) {
        refreshQueued.current = false;
        refresh();
      }
    }
  }, [repoPath]);

  useEffect(() => {
    refresh();
    window.electronAPI.gitWatchStart(repoPath);
    const cleanup = window.electronAPI.onGitChanged((changedPath) => {
      if (changedPath === repoPath) {
        refresh();
      }
    });
    return () => {
      cleanup();
      window.electronAPI.gitWatchStop(repoPath);
    };
  }, [repoPath, refresh]);

  const stagedFiles = useMemo(
    () => status?.files.filter((f) => f.staged) ?? [],
    [status],
  );
  const unstagedFiles = useMemo(
    () => status?.files.filter((f) => !f.staged) ?? [],
    [status],
  );
  const totalFiles = (status?.files ?? []).length;
  const ahead = status?.ahead ?? 0;

  const handleStage = useCallback(
    async (path: string) => {
      await window.electronAPI.gitStage(repoPath, [path]);
      refresh();
    },
    [repoPath, refresh],
  );

  const handleUnstage = useCallback(
    async (path: string) => {
      await window.electronAPI.gitUnstage(repoPath, [path]);
      refresh();
    },
    [repoPath, refresh],
  );

  const handleStageAll = useCallback(async () => {
    const paths = (status?.files.filter((f) => !f.staged) ?? []).map(
      (f) => f.path,
    );
    if (paths.length === 0) return;
    await window.electronAPI.gitStage(repoPath, paths);
    refresh();
  }, [repoPath, refresh, status]);

  const handleUnstageAll = useCallback(async () => {
    const paths = (status?.files.filter((f) => f.staged) ?? []).map(
      (f) => f.path,
    );
    if (paths.length === 0) return;
    await window.electronAPI.gitUnstage(repoPath, paths);
    refresh();
  }, [repoPath, refresh, status]);

  const handleCommit = useCallback(async () => {
    const hasStaged = status?.files.some((f) => f.staged) ?? false;
    if (!commitMsg.trim() || !hasStaged) return;
    await window.electronAPI.gitCommit(repoPath, commitMsg.trim());
    setCommitMsg("");
    refresh();
  }, [repoPath, commitMsg, status, refresh]);

  const handlePush = useCallback(async () => {
    if (ahead === 0 || pushing) return;
    setPushing(true);
    try {
      await window.electronAPI.gitPush(repoPath);
      refresh();
    } finally {
      setPushing(false);
    }
  }, [repoPath, ahead, pushing, refresh]);

  const handleOpenAllDiffs = useCallback(() => {
    openAllDiffsTab(repoPath);
  }, [repoPath, openAllDiffsTab]);

  if (collapsed) {
    return (
      <div className="w-8 shrink-0 border-l border-border flex flex-col items-center pt-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setCollapsed(false)}
          title="Expand git panel"
        >
          <IconChevronLeft size={14} />
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-80 shrink-0 border-l border-border flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 h-10 shrink-0 border-b border-border">
        <IconGitBranch size={12} className="text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground truncate flex-1">
          {status?.branch ?? "..."}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleOpenAllDiffs}
              disabled={totalFiles === 0}
            >
              <IconEye size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Review all changes</TooltipContent>
        </Tooltip>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={refresh}
          disabled={loading}
          title="Refresh"
        >
          <IconRefresh size={12} className={loading ? "animate-spin" : ""} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setCollapsed(true)}
          title="Collapse"
        >
          <IconChevronRight size={14} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <FileSection
          title="Staged Changes"
          files={stagedFiles}
          repoPath={repoPath}
          onStage={handleStage}
          onUnstage={handleUnstage}
          onViewDiff={openDiffTab}
          actionLabel="Unstage All"
          actionIcon={<IconMinus size={12} />}
          onAction={handleUnstageAll}
        />
        <FileSection
          title="Changes"
          files={unstagedFiles}
          repoPath={repoPath}
          onStage={handleStage}
          onUnstage={handleUnstage}
          onViewDiff={openDiffTab}
          actionLabel="Stage All"
          actionIcon={<IconPlus size={12} />}
          onAction={handleStageAll}
        />
      </div>

      <div className="shrink-0 border-t border-border p-2 flex flex-col gap-2">
        <Textarea
          placeholder="Commit message..."
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          rows={2}
          className="resize-none text-xs"
        />
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="flex-1"
            disabled={!commitMsg.trim() || stagedFiles.length === 0}
            onClick={handleCommit}
          >
            Commit ({stagedFiles.length} file
            {stagedFiles.length !== 1 ? "s" : ""})
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                disabled={ahead === 0 || pushing}
                onClick={handlePush}
              >
                <IconArrowUp
                  size={14}
                  className={pushing ? "animate-pulse" : ""}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {ahead > 0
                ? `Push ${ahead} commit${ahead !== 1 ? "s" : ""}`
                : "Nothing to push"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
});

interface FileSectionProps {
  title: string;
  files: GitFileStatus[];
  repoPath: string;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onViewDiff: (filePath: string, staged: boolean, repoPath: string) => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  onAction: () => void;
}

const FileSection = memo(function FileSection({
  title,
  files,
  repoPath,
  onStage,
  onUnstage,
  onViewDiff,
  actionLabel,
  actionIcon,
  onAction,
}: FileSectionProps) {
  return (
    <div className="border-b border-border/50">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {title} ({files.length})
        </span>
        {files.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-5 px-1.5 text-[10px] gap-1"
            onClick={onAction}
            title={actionLabel}
          >
            {actionIcon}
            {actionLabel}
          </Button>
        )}
      </div>
      {files.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/50 px-3 pb-2">
          No files
        </p>
      ) : (
        <div className="pb-1">
          {files.map((f) => (
            <GitFileItem
              key={f.path}
              file={f}
              repoPath={repoPath}
              onStage={onStage}
              onUnstage={onUnstage}
              onViewDiff={onViewDiff}
            />
          ))}
        </div>
      )}
    </div>
  );
});
