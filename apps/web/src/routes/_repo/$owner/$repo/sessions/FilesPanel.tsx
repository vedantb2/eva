"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { useQueryState } from "nuqs";
import { api, type Id } from "@conductor/backend";
import { Button, Spinner } from "@conductor/ui";
import { IconRefresh } from "@tabler/icons-react";
import { toRepoRelativePath } from "@/lib/components/chat/ChangedFilesCard";
import { fileViewerPathParser } from "@/lib/search-params";
import { FileViewerPanel, ViewerNotice } from "./FileViewerPanel";
import { SandboxFileTree } from "./_components/SandboxFileTree";

interface FilesPanelProps {
  sandboxId: string | undefined;
  repoId: Id<"githubRepos">;
  isActive: boolean;
}

type FileListState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "not_running" }
  | { kind: "error"; message: string }
  | {
      kind: "loaded";
      root: string;
      paths: string[];
      truncated: boolean;
      version: number;
    };

// Module-level, keyed by sandboxId — same pattern/rationale as fileCache in
// FileViewerPanel: session heartbeats remount often; skip re-fetching.
const fileListCache = new Map<
  string,
  { root: string; paths: string[]; truncated: boolean; version: number }
>();

function pathsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function deriveSelectedRelPath(
  file: string,
  root: string | null,
): string | null {
  if (!file || !root) return null;
  const prefix = `${root}/`;
  if (file.startsWith(prefix)) {
    return file.slice(prefix.length);
  }
  const relative = toRepoRelativePath(file);
  if (relative === file) return null;
  return relative;
}

/**
 * Session Files tab: searchable repo tree + file viewer. Chip → `?file=` deep
 * links still drive the viewer; the tree highlights the matching path.
 */
export function FilesPanel({ sandboxId, repoId, isActive }: FilesPanelProps) {
  const listSandboxFiles = useAction(api.sandbox.listSandboxFiles);
  const [file, setFile] = useQueryState("file", fileViewerPathParser);
  const [listState, setListState] = useState<FileListState>(() => {
    if (!sandboxId) return { kind: "idle" };
    const cached = fileListCache.get(sandboxId);
    return cached ? { kind: "loaded", ...cached } : { kind: "idle" };
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Guards ~5s heartbeat re-renders from re-fetching the same sandbox list.
  const loadedFor = useRef<string>("");

  const fetchList = async (
    id: string,
    options: { refreshing: boolean },
  ): Promise<void> => {
    if (options.refreshing) {
      setIsRefreshing(true);
    } else {
      setListState({ kind: "loading" });
    }
    try {
      const res = await listSandboxFiles({ sandboxId: id, repoId });
      if (res.status === "not_running") {
        fileListCache.delete(id);
        setListState({ kind: "not_running" });
        return;
      }
      const prev = fileListCache.get(id);
      const contentUnchanged =
        prev !== undefined &&
        prev.root === res.root &&
        prev.truncated === res.truncated &&
        pathsEqual(prev.paths, res.paths);
      const version = contentUnchanged
        ? prev.version
        : (prev?.version ?? 0) + 1;
      const next = {
        root: res.root,
        paths: res.paths,
        truncated: res.truncated,
        version,
      };
      fileListCache.set(id, next);
      setListState({ kind: "loaded", ...next });
    } catch (err) {
      loadedFor.current = "";
      setListState({
        kind: "error",
        message: err instanceof Error ? err.message : "Failed to list files",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!sandboxId || !isActive) {
      loadedFor.current = "";
      return;
    }
    if (loadedFor.current === sandboxId) return;
    loadedFor.current = sandboxId;

    const cached = fileListCache.get(sandboxId);
    if (cached) {
      setListState({ kind: "loaded", ...cached });
      return;
    }

    let cancelled = false;
    void (async () => {
      setListState({ kind: "loading" });
      try {
        const res = await listSandboxFiles({ sandboxId, repoId });
        if (cancelled) return;
        if (res.status === "not_running") {
          fileListCache.delete(sandboxId);
          setListState({ kind: "not_running" });
          return;
        }
        const next = {
          root: res.root,
          paths: res.paths,
          truncated: res.truncated,
          version: 1,
        };
        fileListCache.set(sandboxId, next);
        setListState({ kind: "loaded", ...next });
      } catch (err) {
        if (cancelled) return;
        loadedFor.current = "";
        setListState({
          kind: "error",
          message: err instanceof Error ? err.message : "Failed to list files",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sandboxId, isActive, repoId, listSandboxFiles]);

  const handleRefresh = () => {
    if (!sandboxId || isRefreshing) return;
    void fetchList(sandboxId, { refreshing: true });
  };

  const root = listState.kind === "loaded" ? listState.root : null;
  const selectedPath = deriveSelectedRelPath(file, root);

  const handleSelectFile = (relPath: string) => {
    if (!root) return;
    void setFile(`${root}/${relPath}`);
  };

  if (!sandboxId || !isActive) {
    return <ViewerNotice message="Start the sandbox to browse files" />;
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 w-64 shrink-0 flex-col border-r border-border">
        {listState.kind === "loading" || listState.kind === "idle" ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : listState.kind === "not_running" ? (
          <ViewerNotice message="Start the sandbox to browse files" />
        ) : listState.kind === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
            <pre className="max-h-48 max-w-full overflow-auto whitespace-pre-wrap rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
              {listState.message}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!sandboxId) return;
                loadedFor.current = "";
                void fetchList(sandboxId, { refreshing: false });
              }}
            >
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
            onRefresh={handleRefresh}
            onSelectFile={handleSelectFile}
          />
        )}
      </div>
      <div className="min-h-0 flex-1">
        <FileViewerPanel
          sandboxId={sandboxId}
          repoId={repoId}
          isActive={isActive}
        />
      </div>
    </div>
  );
}
