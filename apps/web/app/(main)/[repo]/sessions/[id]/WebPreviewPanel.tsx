"use client";

import { useRef, type ReactNode } from "react";
import {
  Spinner,
  Button,
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
  WebPreviewBody,
  WebPreviewConsole,
  useWebPreview,
} from "@conductor/ui";
import {
  IconArrowLeft,
  IconArrowRight,
  IconRefresh,
  IconWorld,
  IconExternalLink,
  IconMaximize,
} from "@tabler/icons-react";

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
  terminal?: ReactNode;
  tabSwitcher?: ReactNode;
  showConsole?: boolean;
}

function NavigationButtons({
  previewInfo,
  isLoading,
  onRefresh,
  containerRef,
  tabSwitcher,
}: {
  previewInfo: PreviewInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  tabSwitcher?: ReactNode;
}) {
  const { goBack, goForward, reload } = useWebPreview();

  return (
    <WebPreviewNavigation>
      {tabSwitcher}
      <div className="ml-auto" />
      <WebPreviewNavigationButton tooltip="Back" onClick={goBack}>
        <IconArrowLeft className="w-3.5 h-3.5" />
      </WebPreviewNavigationButton>
      <WebPreviewNavigationButton tooltip="Forward" onClick={goForward}>
        <IconArrowRight className="w-3.5 h-3.5" />
      </WebPreviewNavigationButton>
      <WebPreviewNavigationButton
        tooltip="Reload"
        onClick={isLoading ? onRefresh : reload}
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <IconRefresh className="w-3.5 h-3.5" />
        )}
      </WebPreviewNavigationButton>
      <WebPreviewUrl readOnly className="h-8 text-xs max-w-64" />
      {previewInfo && (
        <WebPreviewNavigationButton
          tooltip="Open in new tab"
          onClick={() => window.open(previewInfo.url, "_blank")}
        >
          <IconExternalLink className="w-3.5 h-3.5" />
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

export function WebPreviewPanel({
  isActive,
  sandboxId,
  previewInfo,
  isLoading,
  error,
  iframeKey,
  onRefresh,
  terminal,
  tabSwitcher,
  showConsole,
}: WebPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!isActive || !sandboxId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-1 border-b p-2">
          {tabSwitcher}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconWorld className="w-12 h-12 opacity-50" />
          <p className="text-sm">
            {!isActive
              ? "Start the sandbox to preview your app"
              : "Waiting for sandbox..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <WebPreview
      ref={containerRef}
      defaultUrl={previewInfo?.url ?? ""}
      className="h-full rounded-none border-0"
    >
      <NavigationButtons
        previewInfo={previewInfo}
        isLoading={isLoading}
        onRefresh={onRefresh}
        containerRef={containerRef}
        tabSwitcher={tabSwitcher}
      />
      <WebPreviewBody
        key={iframeKey}
        src={previewInfo?.url}
        loading={
          isLoading && !previewInfo ? (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-red-500">{error}</p>
              <Button size="sm" variant="secondary" onClick={onRefresh}>
                <IconRefresh className="w-4 h-4" />
                Retry
              </Button>
            </div>
          ) : undefined
        }
      />
      <WebPreviewConsole
        terminal={terminal}
        className={showConsole ? undefined : "hidden"}
      />
    </WebPreview>
  );
}
