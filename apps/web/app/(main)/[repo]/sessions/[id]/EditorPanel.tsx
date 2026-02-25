"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import { Spinner, Button } from "@conductor/ui";
import { IconCode, IconRefresh } from "@tabler/icons-react";

interface EditorPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
  tabSwitcher: ReactNode;
  repoId: string;
}

export function EditorPanel({
  sessionId,
  sandboxId,
  isActive,
  repoId,
  tabSwitcher,
}: EditorPanelProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const attempts = useRef(0);
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);

  const pollForEditor = useCallback(async () => {
    if (!sandboxId || !isActive) return;
    setUrl(null);
    setIsLoading(true);
    setError(null);
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
          setIsLoading(false);
          return;
        }
        attempts.current += 1;
        if (attempts.current >= 20) {
          setError("Editor failed to start. Check sandbox logs.");
          setIsLoading(false);
          return;
        }
        pollTimer.current = setTimeout(check, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load editor");
        setIsLoading(false);
      }
    };

    check();
  }, [sandboxId, isActive, getPreviewUrl, repoId]);

  useEffect(() => {
    if (isActive && sandboxId) {
      pollForEditor();
    }
    return () => clearTimeout(pollTimer.current);
  }, [isActive, sandboxId, pollForEditor]);

  if (!isActive || !sandboxId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-1 border-b p-2">
          {tabSwitcher}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconCode className="w-12 h-12 opacity-50" />
          <p className="text-sm">
            {!isActive
              ? "Start the sandbox to use the editor"
              : "Waiting for sandbox..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 border-b p-2">{tabSwitcher}</div>
      <div className="flex-1 min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">Starting editor...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="secondary" onClick={pollForEditor}>
              <IconRefresh className="w-4 h-4" />
              Retry
            </Button>
          </div>
        )}
        {url && (
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
