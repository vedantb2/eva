"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Spinner, Button } from "@conductor/ui";
import {
  IconCode,
  IconRefresh,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react";

type EditorState = "idle" | "starting" | "running" | "stopping" | "error";

interface EditorPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
  tabSwitcher: ReactNode;
  repoId: Id<"githubRepos">;
}

export function EditorPanel({
  sandboxId,
  isActive,
  repoId,
  tabSwitcher,
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
  }, [sandboxId, isActive, getPreviewUrl, repoId]);

  const handleStart = useCallback(async () => {
    if (!sandboxId) return;
    setEditorState("starting");
    setError(null);
    setUrl(null);
    stopPolling();
    try {
      await toggleCodeServer({ sandboxId, repoId, action: "start" });
      await pollForReady();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start editor");
      setEditorState("error");
    }
  }, [sandboxId, repoId, toggleCodeServer, pollForReady, stopPolling]);

  const handleStop = useCallback(async () => {
    if (!sandboxId) return;
    setEditorState("stopping");
    stopPolling();
    try {
      await toggleCodeServer({ sandboxId, repoId, action: "stop" });
    } catch {
      // Best-effort stop
    }
    setUrl(null);
    setError(null);
    setEditorState("idle");
  }, [sandboxId, repoId, toggleCodeServer, stopPolling]);

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
      <div className="flex items-center gap-1 border-b p-2">
        {tabSwitcher}
        <div className="ml-auto">
          {editorState === "running" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStop}
              className="text-muted-foreground hover:text-destructive"
            >
              <IconPlayerStop className="w-4 h-4 mr-1" />
              Stop Editor
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        {editorState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <IconCode className="w-12 h-12 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Editor is not running
            </p>
            <Button size="sm" onClick={handleStart}>
              <IconPlayerPlay className="w-4 h-4 mr-1" />
              Start Editor
            </Button>
          </div>
        )}
        {(editorState === "starting" || editorState === "stopping") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">
              {editorState === "starting"
                ? "Starting editor..."
                : "Stopping editor..."}
            </p>
          </div>
        )}
        {editorState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="secondary" onClick={handleStart}>
              <IconRefresh className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        )}
        {url && editorState === "running" && (
          <iframe
            src={url}
            className="absolute inset-0 w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}
