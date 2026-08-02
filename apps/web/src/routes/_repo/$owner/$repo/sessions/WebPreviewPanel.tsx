import { useMemo, useRef, useState } from "react";
import { Spinner, Button, WebPreview, WebPreviewBody } from "@eva/ui";
import { useSessionStorage } from "usehooks-ts";
import { IconPlayerPlay, IconRefresh, IconWorld } from "@tabler/icons-react";
import {
  buildUrlWithPath,
  normalizePreviewPath,
} from "@/lib/components/PreviewNavBar";
import { PreviewAnnotationLayer } from "./_components/PreviewAnnotationLayer";
import { PreviewPanelNavBar } from "./_components/PreviewPanelNavBar";
import {
  PREVIEW_DEVICE_WIDTHS,
  type PreviewDevice,
} from "./_utils/-previewAnnotation";

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
  port: number;
  onPortChange: (port: number) => void;
  pathStorageKey: string;
  /**
   * When set (sessions), Preview path is sticky on Convex. `undefined` while
   * the session query loads — falls back to sessionStorage until then.
   */
  stickyPath?: string;
  onStickyPathChange?: (path: string) => void;
  /** When set (sessions), Preview empty state shows a Start sandbox button. */
  onStartSandbox?: () => void;
  isSandboxStarting?: boolean;
  /**
   * Session-only: submit compact display + rich agent prompt for a preview
   * annotation. When absent, the select-element toggle is hidden.
   */
  onAnnotationSubmit?: (display: string, full: string) => Promise<void>;
}

export function WebPreviewPanel({
  isActive,
  sandboxId,
  previewInfo,
  isLoading,
  error,
  iframeKey,
  onRefresh,
  port,
  onPortChange,
  pathStorageKey,
  stickyPath,
  onStickyPathChange,
  onStartSandbox,
  isSandboxStarting = false,
  onAnnotationSubmit,
}: WebPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [localPath, setLocalPath] = useSessionStorage(pathStorageKey, "/", {
    serializer: (value) => value,
    deserializer: (value) => normalizePreviewPath(value),
  });
  const [device, setDevice] = useSessionStorage<PreviewDevice>(
    `${pathStorageKey}:device`,
    "desktop",
  );
  const previewPath = stickyPath ?? localPath;

  // iframeSrc is recomputed only at remount points (previewInfo change,
  // storage-key change, or iframeKey bump from a refresh). previewPath is
  // intentionally excluded from deps so the src stays stable while the user
  // navigates inside the iframe — otherwise we'd fight the iframe with
  // declarative src updates.
  const iframeSrc = useMemo(() => {
    if (!previewInfo) return undefined;
    return buildUrlWithPath(previewInfo.url, previewPath);
    // eslint-disable-next-line react/exhaustive-deps
  }, [previewInfo, pathStorageKey, iframeKey]);

  function handlePathChange(path: string) {
    const next = normalizePreviewPath(path);
    setLocalPath(next);
    onStickyPathChange?.(next);
  }

  if (!isActive || !sandboxId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <IconWorld className="size-8 opacity-50" />
          <p className="text-sm font-medium text-foreground">
            {!isActive ? "Start the sandbox to preview" : "Waiting for sandbox…"}
          </p>
          {!isActive && onStartSandbox ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onStartSandbox}
              disabled={isSandboxStarting}
            >
              <IconPlayerPlay size={14} />
              {isSandboxStarting ? "Starting…" : "Start sandbox"}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const deviceWidth =
    device === "desktop" ? undefined : PREVIEW_DEVICE_WIDTHS[device];

  return (
    <WebPreview
      ref={containerRef}
      defaultUrl={iframeSrc ?? ""}
      className="h-full rounded-none border-0"
    >
      <PreviewPanelNavBar
        previewInfo={previewInfo}
        isLoading={isLoading}
        onRefresh={onRefresh}
        containerRef={containerRef}
        port={port}
        onPortChange={onPortChange}
        previewPath={previewPath}
        onPathChange={handlePathChange}
        device={device}
        onDeviceChange={setDevice}
        annotationMode={annotationMode}
        onAnnotationModeChange={setAnnotationMode}
        showAnnotationToggle={Boolean(onAnnotationSubmit)}
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <WebPreviewBody
          key={iframeKey}
          src={iframeSrc}
          className={deviceWidth ? "mx-auto border-x border-border" : undefined}
          style={
            deviceWidth ? { width: deviceWidth, maxWidth: "100%" } : undefined
          }
          loading={
            isLoading && !previewInfo ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
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
        {onAnnotationSubmit ? (
          <PreviewAnnotationLayer
            mode={annotationMode}
            onModeChange={setAnnotationMode}
            onSubmit={onAnnotationSubmit}
          />
        ) : null}
      </div>
    </WebPreview>
  );
}
