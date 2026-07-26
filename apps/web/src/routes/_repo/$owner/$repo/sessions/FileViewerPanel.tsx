import { Suspense, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { useQueryState } from "nuqs";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, MessageResponse, Spinner } from "@eva/ui";
import {
  IconFileText,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconMarkdown,
  IconCode,
} from "@tabler/icons-react";
import { fileViewerPathParser, markdownViewParser } from "@/lib/search-params";
import { LazyCodeBlock } from "@/lib/components/LazyCodeBlock";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import { shikiLangForPath } from "./_utils/-fileViewerLang";
import {
  isMarkdownPath,
  mediaFileForPath,
  type MediaFile,
} from "./_utils/-fileViewerMedia";

interface FileViewerPanelProps {
  sandboxId: string | undefined;
  repoId: Id<"githubRepos">;
  isActive: boolean;
}

// A file the viewer successfully read: either text, or media as a data URL.
type LoadedPayload =
  | { kind: "loaded"; content: string; truncated: boolean }
  | { kind: "media"; media: MediaFile; dataUrl: string };

// Local (not live-query) state: reading a file is a one-shot action, not a
// reactive query, so the result is held here and re-fetched on demand.
type ViewerState =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "not_running" }
  | { kind: "not_found" }
  | { kind: "binary" }
  | { kind: "too_large"; size: number }
  | { kind: "error"; message: string }
  | LoadedPayload;

// Last successful read per sandbox+path. The session view re-renders every ~5s
// (agent streaming heartbeat); seeding from this cache lets a re-render or
// remount show content instantly instead of flashing the loading spinner.
const fileCache = new Map<string, LoadedPayload>();

function fileCacheKey(sandboxId: string, path: string): string {
  return `${sandboxId} ${path}`;
}

function formatBytes(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

/** Centered icon + message, matching the sandbox panels' inactive states. */
export function ViewerNotice({ message }: { message: string }) {
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
 *
 * Images and videos are read separately as base64 and shown as data URLs;
 * markdown renders by default with a header toggle back to source.
 */
export function FileViewerPanel({
  sandboxId,
  repoId,
  isActive,
}: FileViewerPanelProps) {
  const readSandboxFile = useAction(api.sandbox.readSandboxFile);
  const readSandboxMediaFile = useAction(api.sandbox.readSandboxMediaFile);
  const [filePath] = useQueryState("file", fileViewerPathParser);
  const [markdownView, setMarkdownView] = useQueryState(
    "md",
    markdownViewParser,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<ViewerState>(() => {
    if (!filePath || !sandboxId || !isActive) return { kind: "empty" };
    return (
      fileCache.get(fileCacheKey(sandboxId, filePath)) ?? { kind: "empty" }
    );
  });
  // The (path + refresh) tuple we last kicked a load for. Guards against the
  // ~5s heartbeat re-renders re-fetching the same file over and over: we only
  // load when the selected file actually changes or Refresh bumps refreshKey.
  const loadedFor = useRef<string>("");

  useEffect(() => {
    if (!filePath) {
      setState({ kind: "empty" });
      loadedFor.current = "";
      return;
    }
    if (!sandboxId || !isActive) {
      setState({ kind: "not_running" });
      loadedFor.current = "";
      return;
    }

    const key = fileCacheKey(sandboxId, filePath);
    const attempt = `${key} ${refreshKey}`;
    if (attempt === loadedFor.current) return;
    loadedFor.current = attempt;

    // Show cached content immediately (no spinner) while we revalidate; only
    // fall back to the spinner when this file has never been read.
    const cached = fileCache.get(key);
    setState(cached ?? { kind: "loading" });

    let cancelled = false;
    void (async () => {
      try {
        const media = mediaFileForPath(filePath);
        if (media) {
          const res = await readSandboxMediaFile({
            sandboxId,
            repoId,
            path: filePath,
          });
          if (cancelled) return;
          if (res.status === "ok") {
            const payload: LoadedPayload = {
              kind: "media",
              media,
              dataUrl: `data:${media.mimeType};base64,${res.base64}`,
            };
            fileCache.set(key, payload);
            setState(payload);
          } else {
            fileCache.delete(key);
            // if/else rather than a ternary: React Compiler bails on the whole
            // file when a conditional expression sits inside a try/catch.
            if (res.status === "too_large") {
              setState({ kind: "too_large", size: res.size });
            } else {
              setState({ kind: res.status });
            }
          }
          return;
        }

        const res = await readSandboxFile({
          sandboxId,
          repoId,
          path: filePath,
        });
        if (cancelled) return;
        if (res.status === "ok") {
          const payload: LoadedPayload = {
            kind: "loaded",
            content: res.content,
            truncated: res.truncated,
          };
          fileCache.set(key, payload);
          setState(payload);
        } else {
          fileCache.delete(key);
          setState({ kind: res.status });
        }
      } catch (err) {
        if (cancelled) return;
        // Let the next change retry rather than pinning the failed attempt.
        loadedFor.current = "";
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Failed to read file",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    filePath,
    sandboxId,
    isActive,
    repoId,
    readSandboxFile,
    readSandboxMediaFile,
    refreshKey,
  ]);

  if (state.kind === "empty") {
    return <ViewerNotice message="Select a file to view it" />;
  }
  if (state.kind === "not_running") {
    return <ViewerNotice message="Start the sandbox to view files" />;
  }

  const isMarkdown = isMarkdownPath(filePath);
  const showRenderedMarkdown = isMarkdown && markdownView === "rendered";

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
        {state.kind === "loaded" && isMarkdown ? (
          <Button
            size="sm"
            variant="ghost"
            className="size-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
            onClick={() =>
              void setMarkdownView(
                markdownView === "rendered" ? "source" : "rendered",
              )
            }
            aria-label={
              markdownView === "rendered" ? "Show source" : "Show rendered"
            }
          >
            {markdownView === "rendered" ? (
              <IconCode className="size-3.5" />
            ) : (
              <IconMarkdown className="size-3.5" />
            )}
          </Button>
        ) : null}
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
        ) : state.kind === "too_large" ? (
          <ViewerNotice
            message={`This file is ${formatBytes(state.size)}. Previews are limited to 4 MB.`}
          />
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
        ) : state.kind === "media" ? (
          <div className="flex min-h-full items-center justify-center p-4">
            {state.media.kind === "image" ? (
              <ScreenshotPreview url={state.dataUrl} alt={filePath} />
            ) : (
              <VideoPreview url={state.dataUrl} className="w-full" />
            )}
          </div>
        ) : (
          <>
            {state.truncated ? (
              <p className="border-b border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
                Showing the first 512 KB of this file.
              </p>
            ) : null}
            {showRenderedMarkdown ? (
              <MessageResponse className="prose prose-sm dark:prose-invert max-w-none px-4 py-3">
                {state.content}
              </MessageResponse>
            ) : (
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
            )}
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
