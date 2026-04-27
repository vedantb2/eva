import { useState, useCallback, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Spinner, Button } from "@conductor/ui";
import {
  IconCode,
  IconRefresh,
  IconMaximize,
  IconExternalLink,
  IconPlayerStop,
} from "@tabler/icons-react";
import { ensureHttps } from "@/lib/utils/ensureHttps";
import { dismissDaytonaWarning } from "@/lib/utils/dismissDaytonaWarning";
import { createSessionCache } from "@/lib/utils/sessionCache";

type EditorState = "idle" | "starting" | "running" | "error";

const editorCache = createSessionCache("editor");

interface EditorPanelProps {
  cacheKey: string;
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
}

export function EditorPanel({
  cacheKey,
  sandboxId,
  isActive,
  repoId,
}: EditorPanelProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const attempts = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);
  const toggleCodeServer = useAction(api.daytona.toggleCodeServer);

  const stopPolling = useCallback(() => {
    clearTimeout(pollTimer.current);
    pollTimer.current = undefined;
  }, []);

  const pollForReady = useCallback(async () => {
    if (!sandboxId || !isActive) return;
    attempts.current = 0;

    const check = async () => {
      try {
        const data = await getPreviewUrl({
          sandboxId,
          port: 8080,
          checkReady: true,
          repoId,
        });
        if (data.ready) {
          await dismissDaytonaWarning(data.url);
          setUrl(data.url);
          setEditorState("running");
          editorCache.set(cacheKey, data.url);
          return;
        }
        attempts.current += 1;
        if (attempts.current >= 20) {
          setError("Editor failed to start. Check sandbox logs.");
          setEditorState("error");

          return;
        }
        pollTimer.current = setTimeout(check, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load editor");
        setEditorState("error");
      }
    };

    check();
  }, [sandboxId, isActive, getPreviewUrl, repoId, cacheKey]);

  const startEditor = useCallback(async () => {
    if (!sandboxId) return;
    setEditorState("starting");
    setError(null);
    setUrl(null);
    stopPolling();
    try {
      const existing = await getPreviewUrl({
        sandboxId,
        port: 8080,
        checkReady: true,
        repoId,
      });
      if (existing.ready) {
        await dismissDaytonaWarning(existing.url);
        setUrl(existing.url);
        setEditorState("running");
        editorCache.set(cacheKey, existing.url);
        return;
      }
      const result = await toggleCodeServer({
        sandboxId,
        repoId,
        action: "start",
      });
      if (!result.success) {
        const errorMsg = result.logs
          ? `${result.message}\n\nLogs:\n${result.logs}`
          : result.message;
        setError(errorMsg);
        setEditorState("error");
        return;
      }
      await pollForReady();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start editor");
      setEditorState("error");
    }
  }, [
    sandboxId,
    repoId,
    toggleCodeServer,
    pollForReady,
    stopPolling,
    getPreviewUrl,
    cacheKey,
  ]);

  const stopEditor = useCallback(async () => {
    if (!sandboxId) return;
    stopPolling();
    setEditorState("idle");
    setUrl(null);
    setError(null);
    editorCache.clear(cacheKey);
    try {
      await toggleCodeServer({ sandboxId, repoId, action: "stop" });
    } catch {
      // best-effort stop
    }
  }, [sandboxId, stopPolling, cacheKey, toggleCodeServer, repoId]);

  useEffect(() => {
    if (isActive && sandboxId && editorState === "idle") {
      const cached = editorCache.get(cacheKey);
      if (cached) {
        setUrl(cached);
        setEditorState("running");
      }
    }
    if (!isActive) {
      editorCache.clear(cacheKey);
    }
    return stopPolling;
  }, [isActive, sandboxId, editorState, stopPolling, cacheKey]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!isActive || !sandboxId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <IconCode className="w-12 h-12 opacity-50" />
        <p className="text-sm">Start the sandbox to use the editor</p>
      </div>
    );
  }

  if (editorState === "idle") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <IconCode className="w-12 h-12 opacity-50" />
        <p className="text-sm">Editor is not running</p>
        <Button size="sm" variant="secondary" onClick={startEditor}>
          Start Editor
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      {url && editorState === "running" && (
        <div className="flex items-center justify-end gap-1 pb-1 mb-1 px-2 py-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={toggleFullscreen}
          >
            <IconMaximize className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="size-8" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <IconExternalLink className="w-4 h-4" />
            </a>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-destructive hover:bg-destructive/10"
            onClick={stopEditor}
          >
            <IconPlayerStop className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
        {editorState === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">Starting editor...</p>
          </div>
        )}
        {editorState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 p-4">
            <pre className="text-sm text-destructive whitespace-pre-wrap max-w-full max-h-48 overflow-auto bg-destructive/5 p-3 rounded-md">
              {error}
            </pre>
            <Button size="sm" variant="secondary" onClick={startEditor}>
              <IconRefresh className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        )}
        {url && editorState === "running" && (
          <iframe
            src={ensureHttps(url)}
            className="absolute inset-0 w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}
