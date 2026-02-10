"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Spinner } from "@conductor/ui";
import { IconCode } from "@tabler/icons-react";

interface EditorPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
  tabSwitcher: ReactNode;
}

export function EditorPanel({
  sessionId,
  sandboxId,
  isActive,
  tabSwitcher,
}: EditorPanelProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUrl = useCallback(async () => {
    if (!sandboxId || !isActive) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/sessions/preview?sessionId=${sessionId}&port=8080`,
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get editor URL");
      }
      const data = await response.json();
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load editor");
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId, isActive, sessionId]);

  useEffect(() => {
    if (isActive && sandboxId) {
      fetchUrl();
    }
  }, [isActive, sandboxId, fetchUrl]);

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
      <div className="flex-1 relative">
        {isLoading && !url && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
            <Spinner size="lg" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
        {url && (
          <iframe
            src={url}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}
