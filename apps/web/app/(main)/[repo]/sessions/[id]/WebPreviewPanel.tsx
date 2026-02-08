"use client";

import { Spinner, Button } from "@conductor/ui";
import { IconRefresh, IconWorld } from "@tabler/icons-react";

interface PreviewInfo {
  url: string;
  port: number;
}

interface WebPreviewPanelProps {
  isActive: boolean;
  sandboxId: string | undefined;
  previewInfo: PreviewInfo | null;
  isLoading: boolean;
  error: string | null;
  iframeKey: number;
  onRetry: () => void;
}

export function WebPreviewPanel({
  isActive,
  sandboxId,
  previewInfo,
  isLoading,
  error,
  iframeKey,
  onRetry,
}: WebPreviewPanelProps) {
  if (!isActive || !sandboxId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
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
    <div className="h-full relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
          <Spinner size="lg" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button size="sm" variant="secondary" onClick={onRetry}>
            <IconRefresh className="w-4 h-4" />
            Retry
          </Button>
        </div>
      )}
      {previewInfo && !error && (
        <iframe
          key={iframeKey}
          src={previewInfo.url}
          className="w-full h-full border-0"
          title="Preview"
        />
      )}
    </div>
  );
}
