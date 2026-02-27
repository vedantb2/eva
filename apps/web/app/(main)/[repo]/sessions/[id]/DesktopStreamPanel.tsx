"use client";

import { useRef, type ReactNode } from "react";
import {
  Spinner,
  Button,
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewBody,
} from "@conductor/ui";
import {
  IconRefresh,
  IconDeviceDesktop,
  IconMaximize,
} from "@tabler/icons-react";

interface DesktopStreamPanelProps {
  isActive: boolean;
  sandboxId: string | undefined;
  streamUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  tabSwitcher?: ReactNode;
}

function NavigationButtons({
  streamUrl,
  isLoading,
  onRefresh,
  containerRef,
  tabSwitcher,
}: {
  streamUrl: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  tabSwitcher?: ReactNode;
}) {
  return (
    <WebPreviewNavigation>
      {tabSwitcher}
      <div className="ml-auto" />
      <WebPreviewNavigationButton
        tooltip="Reload"
        onClick={onRefresh}
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <IconRefresh className="w-3.5 h-3.5" />
        )}
      </WebPreviewNavigationButton>
      {streamUrl && (
        <WebPreviewNavigationButton
          tooltip="Open in new tab"
          onClick={() => window.open(streamUrl, "_blank")}
        >
          <IconDeviceDesktop className="w-3.5 h-3.5" />
        </WebPreviewNavigationButton>
      )}
      <WebPreviewNavigationButton
        tooltip="Fullscreen"
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            containerRef.current?.requestFullscreen();
          }
        }}
      >
        <IconMaximize className="w-3.5 h-3.5" />
      </WebPreviewNavigationButton>
    </WebPreviewNavigation>
  );
}

export function DesktopStreamPanel({
  isActive,
  sandboxId,
  streamUrl,
  isLoading,
  error,
  onRefresh,
  tabSwitcher,
}: DesktopStreamPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!isActive || !sandboxId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-1 border-b p-2">
          {tabSwitcher}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconDeviceDesktop className="w-12 h-12 opacity-50" />
          <p className="text-sm">
            {!isActive
              ? "Start the sandbox to view the desktop"
              : "Waiting for sandbox..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <WebPreview
      ref={containerRef}
      defaultUrl={streamUrl ?? ""}
      className="h-full rounded-none border-0"
    >
      <NavigationButtons
        streamUrl={streamUrl}
        isLoading={isLoading}
        onRefresh={onRefresh}
        containerRef={containerRef}
        tabSwitcher={tabSwitcher}
      />
      <WebPreviewBody
        src={streamUrl ?? undefined}
        loading={
          isLoading && !streamUrl ? (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="secondary" onClick={onRefresh}>
                <IconRefresh className="w-4 h-4" />
                Retry
              </Button>
            </div>
          ) : undefined
        }
      />
    </WebPreview>
  );
}
