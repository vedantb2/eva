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
    <WebPreviewNavigation className="gap-1">
      <PreviewDeviceToggle value={device} onChange={onDeviceChange} />
      {showAnnotationToggle ? (
        <WebPreviewNavigationButton
          tooltip={annotationMode ? "Cancel select element" : "Select element"}
          className={cn(
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
        containerRef={containerRef}
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
