"use client";

import type { RefObject } from "react";
import {
  cn,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  useWebPreview,
} from "@eva/ui";
import { IconClick } from "@tabler/icons-react";
import {
  PreviewNavBar,
  normalizePreviewPath,
} from "@/lib/components/PreviewNavBar";
import { PreviewDeviceToggle } from "./PreviewDeviceToggle";
import type { PreviewDevice } from "../_utils/-previewAnnotation";

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
  device,
  onDeviceChange,
  annotationMode,
  onAnnotationModeChange,
  showAnnotationToggle,
}: {
  previewInfo: PreviewInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  /** Host-managed iframe element (PreviewIframeHost) — see PreviewNavBar. */
  iframeElement?: HTMLIFrameElement | null;
  onToggleFullscreen?: () => void;
  port: number;
  onPortChange: (port: number) => void;
  previewPath: string;
  onPathChange: (path: string) => void;
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  annotationMode: boolean;
  onAnnotationModeChange: (active: boolean) => void;
  showAnnotationToggle: boolean;
}) {
  const { iframeRef } = useWebPreview();

  return (
    // `WebPreviewNavigation` does not wrap by default, so the device toggle,
    // the element picker and the URL bar overflowed a phone-width pane.
    <WebPreviewNavigation className="flex-wrap gap-1">
      <PreviewDeviceToggle value={device} onChange={onDeviceChange} />
      {showAnnotationToggle ? (
        <WebPreviewNavigationButton
          tooltip={annotationMode ? "Cancel select element" : "Select element"}
          // The tooltip is wired as `aria-describedby`, which is a description
          // rather than a name.
          aria-label={
            annotationMode ? "Cancel select element" : "Select element"
          }
          aria-pressed={annotationMode}
          className={cn(
            "hit-target",
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
