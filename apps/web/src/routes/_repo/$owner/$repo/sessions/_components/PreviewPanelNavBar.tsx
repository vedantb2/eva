"use client";

import type { RefObject } from "react";
import {
  cn,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  useWebPreview,
} from "@eva/ui";
import { IconClick, IconDevices } from "@tabler/icons-react";
import {
  PreviewNavBar,
  normalizePreviewPath,
} from "@/lib/components/PreviewNavBar";
import { PreviewScreenshotButton } from "./PreviewScreenshotButton";
import type { PreviewViewport } from "../_utils/previewViewport";

interface PreviewInfo {
  url: string;
  port: number;
}

export function PreviewPanelNavBar({
  previewInfo,
  isLoading,
  onRefresh,
  containerRef,
  iframeElement,
  onToggleFullscreen,
  port,
  onPortChange,
  previewPath,
  onPathChange,
  viewport,
  onToggleDevice,
  annotationMode,
  onAnnotationModeChange,
  showAnnotationToggle,
}: {
  previewInfo: PreviewInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  iframeElement?: HTMLIFrameElement | null;
  onToggleFullscreen?: () => void;
  port: number;
  onPortChange: (port: number) => void;
  previewPath: string;
  onPathChange: (path: string) => void;
  viewport: PreviewViewport;
  onToggleDevice: () => void;
  annotationMode: boolean;
  onAnnotationModeChange: (active: boolean) => void;
  showAnnotationToggle: boolean;
}) {
  const { iframeRef } = useWebPreview();
  const deviceActive = viewport.mode !== "fill";

  return (
    <WebPreviewNavigation className="max-sm:flex-wrap gap-1">
      <WebPreviewNavigationButton
        tooltip={deviceActive ? "Fill panel" : "Show device toolbar"}
        aria-label={deviceActive ? "Fill panel" : "Show device toolbar"}
        aria-pressed={deviceActive}
        className={cn(
          "max-sm:hit-target",
          deviceActive && "bg-secondary text-primary hover:text-primary",
        )}
        onClick={onToggleDevice}
      >
        <IconDevices size={16} />
      </WebPreviewNavigationButton>
      <PreviewScreenshotButton iframeElement={iframeElement ?? null} />
      {showAnnotationToggle ? (
        <WebPreviewNavigationButton
          tooltip={annotationMode ? "Cancel select element" : "Select element"}
          aria-label={
            annotationMode ? "Cancel select element" : "Select element"
          }
          aria-pressed={annotationMode}
          className={cn(
            "max-sm:hit-target",
            annotationMode && "bg-secondary text-primary hover:text-primary",
          )}
          onClick={() => onAnnotationModeChange(!annotationMode)}
        >
          <IconClick size={16} />
        </WebPreviewNavigationButton>
      ) : null}
      <PreviewNavBar
        previewUrl={previewInfo?.url ?? null}
        iframeRef={iframeRef}
        iframeElement={iframeElement}
        containerRef={containerRef}
        onToggleFullscreen={onToggleFullscreen}
        port={port}
        path={previewPath}
        onPortChange={onPortChange}
        onPathChange={(path) => onPathChange(normalizePreviewPath(path))}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
    </WebPreviewNavigation>
  );
}
