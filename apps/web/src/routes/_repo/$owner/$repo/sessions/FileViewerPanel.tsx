import { Suspense, useEffect, useState } from "react";
import { useAction } from "convex/react";
import { useQueryState } from "nuqs";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Button, Spinner } from "@conductor/ui";
import {
  IconFileText,
  IconCopy,
  IconCheck,
  IconRefresh,
} from "@tabler/icons-react";
import { fileViewerPathParser } from "@/lib/search-params";
import { LazyCodeBlock } from "@/lib/components/LazyCodeBlock";
import { shikiLangForPath } from "./_utils/-fileViewerLang";

interface FileViewerPanelProps {
  sandboxId: string | undefined;
  repoId: Id<"githubRepos">;
  isActive: boolean;
}

// Local (not live-query) state: reading a file is a one-shot action, not a
// reactive query, so the result is held here and re-fetched on demand.
type ViewerState =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "not_running" }
  | { kind: "not_found" }
  | { kind: "binary" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; content: string; truncated: boolean };

/** Centered icon + message, matching the sandbox panels' inactive states. */
function ViewerNotice({ message }: { message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 px-6 text-center">
      <IconFileText className="w-12 h-12 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/**
 * Read-only viewer for a single file read live from the session's sandbox.
 * The open file is driven by the `?file=` URL param, set when a file chip in
 * the chat is clicked (see the `onOpenFile` wiring from the session route).
 */
export function FileViewerPanel({
  sandboxId,
  repoId,
  isActive,
}: FileViewerPanelProps) {
  const readSandboxFile = useAction(api.daytona.readSandboxFile);
  const [filePath] = useQueryState("file", fileViewerPathParser);
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<ViewerState>({ kind: "empty" });

  useEffect(() => {
    if (!filePath) {
      setState({ kind: "empty" });
      return;
    }
    if (!sandboxId || !isActive) {
      setState({ kind: "not_running" });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });
    void (async () => {
      try {
        const res = await readSandboxFile({
          sandboxId,
          repoId,
          path: filePath,
        });
        if (cancelled) return;
        if (res.status === "ok") {
          setState({
            kind: "loaded",
            content: res.content,
            truncated: res.truncated,
          });
        } else {
          setState({ kind: res.status });
        }
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Failed to read file",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filePath, sandboxId, isActive, repoId, readSandboxFile, refreshKey]);

  if (state.kind === "empty") {
    return <ViewerNotice message="Click a file in the chat to view it here" />;
  }
  if (state.kind === "not_running") {
    return <ViewerNotice message="Start the sandbox to view files" />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <IconFileText className="size-4 shrink-0 text-muted-foreground" />
        <span
          className="min-w-0 flex-1 truncate font-mono text-xs text-foreground"
          title={filePath}
        >
          {filePath}
        </span>
        {state.kind === "loaded" ? (
          <CopyButton content={state.content} />
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="size-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => setRefreshKey((k) => k + 1)}
          aria-label="Refresh file"
        >
          <IconRefresh className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {state.kind === "loading" ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : state.kind === "not_found" ? (
          <ViewerNotice message="This file no longer exists in the sandbox" />
        ) : state.kind === "binary" ? (
          <ViewerNotice message="This file is binary and cannot be shown" />
        ) : state.kind === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
            <pre className="max-h-48 max-w-full overflow-auto whitespace-pre-wrap rounded-surface bg-destructive/5 p-3 text-sm text-destructive">
              {state.message}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              <IconRefresh className="mr-1 size-4" />
              Retry
            </Button>
          </div>
        ) : (
          <>
            {state.truncated ? (
              <p className="border-b border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
                Showing the first 512 KB of this file.
              </p>
            ) : null}
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Spinner size="sm" />
                </div>
              }
            >
              <LazyCodeBlock
                code={state.content}
                language={shikiLangForPath(filePath)}
              />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      className="size-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
      onClick={() => {
        void navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      aria-label="Copy file contents"
    >
      {copied ? (
        <IconCheck className="size-3.5" />
      ) : (
        <IconCopy className="size-3.5" />
      )}
    </Button>
  );
}
