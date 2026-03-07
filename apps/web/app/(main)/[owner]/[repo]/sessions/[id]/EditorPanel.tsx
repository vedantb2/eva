"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Spinner, Button } from "@conductor/ui";
import { IconCode, IconRefresh } from "@tabler/icons-react";
import { ensureHttps } from "@/lib/utils/ensureHttps";
import { createSessionCache } from "@/lib/utils/sessionCache";

type EditorState = "idle" | "starting" | "running" | "error";

const editorCache = createSessionCache("editor");

interface EditorPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
  tabSwitcher: ReactNode;
  repoId: Id<"githubRepos">;
  enabled?: boolean;
}

export function EditorPanel({
  sessionId,
  sandboxId,
  isActive,
  repoId,
  tabSwitcher,
  enabled = true,
}: EditorPanelProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const attempts = useRef(0);
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
          setUrl(data.url);
          setEditorState("running");
          editorCache.set(sessionId, data.url);
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
  }, [sandboxId, isActive, getPreviewUrl, repoId, sessionId]);

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
        setUrl(existing.url);
        setEditorState("running");
        editorCache.set(sessionId, existing.url);
        return;
      }
      await toggleCodeServer({ sandboxId, repoId, action: "start" });
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
    sessionId,
  ]);

  useEffect(() => {
    if (isActive && sandboxId && editorState === "idle") {
      const cached = editorCache.get(sessionId);
      if (cached) {
        setUrl(cached);
        setEditorState("running");
        return;
      }
      startEditor();
    }
    if (!isActive) {
      editorCache.clear(sessionId);
    }
    return stopPolling;
  }, [isActive, sandboxId, editorState, startEditor, stopPolling, sessionId]);

  if (!enabled) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-1 border-b p-2">
          {tabSwitcher}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconCode className="w-12 h-12 opacity-50" />
          <p className="text-sm">Editor (VSCode) is disabled</p>
          <p className="text-xs text-muted-foreground/70">
            Enable it in repository settings under Config.
          </p>
        </div>
      </div>
    );
  }

  if (!isActive || !sandboxId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-1 border-b p-2">
          {tabSwitcher}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconCode className="w-12 h-12 opacity-50" />
          <p className="text-sm">Start the sandbox to use the editor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 border-b p-2">{tabSwitcher}</div>
      <div className="flex-1 min-h-0 relative">
        {editorState === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">Starting editor...</p>
          </div>
        )}
        {editorState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <p className="text-sm text-destructive">{error}</p>
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
