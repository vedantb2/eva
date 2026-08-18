"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import type { Id } from "@eva/backend";
import { Button, Spinner } from "@eva/ui";
import { IconRefresh } from "@tabler/icons-react";
import { toRepoRelativePath } from "@/lib/components/chat/ChangedFilesCard";
import { ResizableSidebar } from "@/lib/components/ResizableSidebar";
import type { SandboxFileListApi } from "@/lib/components/sandbox/useSandboxFileList";
import { fileViewerPathParser } from "@/lib/search-params";
import { FileViewerPanel, ViewerNotice } from "./FileViewerPanel";
import { SandboxFileTree } from "./_components/SandboxFileTree";

interface FilesPanelProps {
  sandboxId: string | undefined;
  repoId: Id<"githubRepos">;
  isActive: boolean;
  fileList: SandboxFileListApi;
}

function deriveSelectedRelPath(
  file: string,
  root: string | null,
): string | null {
  if (!file || !root) return null;
  const prefix = `${root}/`;
  if (file.startsWith(prefix)) return file.slice(prefix.length);
  const relative = toRepoRelativePath(file);
  return relative === file ? null : relative;
}

/** Full-repo tree and read-only viewer driven by the shared sandbox file list. */
export function FilesPanel({
  sandboxId,
  repoId,
  isActive,
  fileList,
}: FilesPanelProps) {
  const [file, setFile] = useQueryState("file", fileViewerPathParser);
  const { state: listState, isRefreshing, refresh } = fileList;
  const root = listState.kind === "loaded" ? listState.root : null;
  const selectedPath = deriveSelectedRelPath(file, root);

  // Below `md` the tree and the viewer are separate panes, so opening a file has
  // to move you to the file — otherwise the tap looks like it did nothing.
  const [showContentSignal, setShowContentSignal] = useState(0);

  const handleSelectFile = (relativePath: string) => {
    if (!root) return;
    void setFile(`${root}/${relativePath}`);
    setShowContentSignal((n) => n + 1);
  };

  if (!sandboxId || !isActive) {
    return <ViewerNotice message="Wake Eva up to browse files" />;
  }

  return (
    <ResizableSidebar
      storageKey="sandbox-file-tree"
      mobilePaneLabels={{ left: "Files", right: "Viewer" }}
      showContentSignal={showContentSignal}
      // The 160/320 defaults add up to a 481px floor, which overflows the
      // sandbox pane on a tablet (and on a narrow desktop pane). Both sides
      // scroll their own content, so they can go narrower than the default.
      minSidebarWidthPx={140}
      minContentWidthPx={200}
      sidebar={
        listState.kind === "loading" || listState.kind === "idle" ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : listState.kind === "not_running" ? (
          <ViewerNotice message="Wake Eva up to browse files" />
        ) : listState.kind === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
            <pre className="max-h-48 max-w-full overflow-auto scroll-fade whitespace-pre-wrap rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
              {listState.message}
            </pre>
            <Button size="sm" variant="secondary" onClick={refresh}>
              <IconRefresh className="mr-1 size-4" />
              Retry
            </Button>
          </div>
        ) : listState.paths.length === 0 ? (
          <ViewerNotice message="No files found in the repository" />
        ) : (
          <SandboxFileTree
            key={`${sandboxId}:${listState.version}`}
            paths={listState.paths}
            truncated={listState.truncated}
            selectedPath={selectedPath}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
            onSelectFile={handleSelectFile}
          />
        )
      }
    >
      <div className="min-h-0 flex-1">
        <FileViewerPanel
          sandboxId={sandboxId}
          repoId={repoId}
          isActive={isActive}
        />
      </div>
    </ResizableSidebar>
  );
}
