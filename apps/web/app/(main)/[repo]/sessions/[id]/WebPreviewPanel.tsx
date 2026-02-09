"use client";

import {
  Spinner,
  Button,
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
  WebPreviewBody,
} from "@conductor/ui";
import { IconRefresh, IconWorld, IconExternalLink } from "@tabler/icons-react";

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
  onRefresh: () => void;
}

export function WebPreviewPanel({
  isActive,
  sandboxId,
  previewInfo,
  isLoading,
  error,
  iframeKey,
  onRefresh,
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
    <WebPreview
      defaultUrl={previewInfo?.url ?? ""}
      className="h-full rounded-none border-0"
    >
      <WebPreviewNavigation>
        <WebPreviewNavigationButton
          tooltip="Refresh"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <IconRefresh className="w-3.5 h-3.5" />
          )}
        </WebPreviewNavigationButton>
        <WebPreviewUrl readOnly className="h-8 text-xs" />
        {previewInfo && (
          <a
            href={previewInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <IconExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </WebPreviewNavigation>
      <div className="flex-1 relative overflow-hidden">
        {isLoading && !previewInfo && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
            <Spinner size="lg" />
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <Button size="sm" variant="secondary" onClick={onRefresh}>
              <IconRefresh className="w-4 h-4" />
              Retry
            </Button>
          </div>
        ) : (
          previewInfo && (
            <WebPreviewBody key={iframeKey} src={previewInfo.url} />
          )
        )}
      </div>
    </WebPreview>
  );
}
