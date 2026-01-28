"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { IconRefresh, IconWorld, IconExternalLink } from "@tabler/icons-react";

interface WebPreviewPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
}

interface PreviewInfo {
  url: string;
  token: string;
  port: number;
}

export function WebPreviewPanel({
  sessionId,
  sandboxId,
  isActive,
}: WebPreviewPanelProps) {
  const [port, setPort] = useState("3000");
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const fetchPreview = async (portToFetch: string) => {
    if (!sandboxId || !isActive) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sessions/preview?sessionId=${sessionId}&port=${portToFetch}`,
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get preview URL");
      }

      const data = await response.json();
      setPreviewInfo(data);
      setIframeKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isActive && sandboxId) {
      fetchPreview(port);
    }
  }, [isActive, sandboxId, sessionId]);

  const handlePortSubmit = () => {
    fetchPreview(port);
  };

  const handlePortChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchPreview(port);
    }
  };

  if (!isActive || !sandboxId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-3">
        <IconWorld className="w-12 h-12 opacity-50" />
        <p className="text-sm">
          {!isActive
            ? "Start the sandbox to preview your app"
            : "Waiting for sandbox..."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-2 px-3 pb-2 bg-white dark:bg-neutral-950">
        <Input
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          onKeyDown={handlePortChange}
          placeholder="Port"
          size="sm"
          className="w-20"
          classNames={{
            input: "text-center",
            inputWrapper: "h-8 min-h-8",
          }}
        />
        <Button
          size="sm"
          variant="flat"
          isIconOnly
          onPress={handlePortSubmit}
          isLoading={isLoading}
        >
          <IconRefresh className="w-4 h-4" />
        </Button>
        {previewInfo && (
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            as="a"
            href={`${previewInfo.url}?DAYTONA_SANDBOX_AUTH_KEY=${previewInfo.token}`}
            target="_blank"
          >
            <IconExternalLink className="w-4 h-4" />
          </Button>
        )}
        {previewInfo && (
          <span className="text-xs text-neutral-500 truncate flex-1">
            {previewInfo.url}
          </span>
        )}
      </div>
      <div className="flex-1 relative min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 z-10">
            <Spinner size="lg" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <Button
              size="sm"
              variant="flat"
              onPress={handlePortSubmit}
              startContent={<IconRefresh className="w-4 h-4" />}
            >
              Retry
            </Button>
          </div>
        )}
        {previewInfo && !error && (
          <div className="h-full flex flex-col">
            <iframe
              key={iframeKey}
              src={`${previewInfo.url}?DAYTONA_SANDBOX_AUTH_KEY=${previewInfo.token}`}
              className="flex-1 w-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}
      </div>
    </div>
  );
}
