import { useMemo, useRef, useState } from "react";
import { cn, Spinner, Button, WebPreview } from "@eva/ui";
import { useSessionStorage } from "usehooks-ts";
import { IconPlayerPlay, IconRefresh, IconWorld } from "@tabler/icons-react";
import {
  buildUrlWithPath,
  normalizePreviewPath,
} from "@/lib/components/PreviewNavBar";
import {
  PersistentPreviewBody,
  useFullscreenElement,
  usePreviewIframeElement,
} from "@/lib/components/sandbox/previewIframeHost";
import { PreviewAnnotationLayer } from "./_components/PreviewAnnotationLayer";
import { PreviewDeviceToolbar } from "./_components/PreviewDeviceToolbar";
import { PreviewPanelNavBar } from "./_components/PreviewPanelNavBar";
import { PreviewViewportFrame } from "./_components/PreviewViewportFrame";
import {
  FILL_PREVIEW_VIEWPORT,
  parsePreviewViewport,
  readStoredPreviewViewport,
  serializePreviewViewport,
  snapshotFillViewport,
  type PreviewViewport,
} from "./_utils/previewViewport";

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
  /** When set (sessions), Preview empty state shows a Wake up Eva button. */
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
  // The live iframe lives in the global PreviewIframeHost (fixed overlay),
  // so it survives route changes. Nav bar / annotation consumers get the
  // element via this subscription instead of an in-tree ref.
  const iframeElement = usePreviewIframeElement(pathStorageKey);
  const fullscreenElement = useFullscreenElement();
  const [fullscreenRequested, setFullscreenRequested] = useState(false);
  // Esc exits fullscreen without going through our toggle — resync in render.
  if (fullscreenRequested && fullscreenElement === null) {
    setFullscreenRequested(false);
  }
  // `containerRef.requestFullscreen` would blank the preview: fixed-position
  // elements outside the fullscreen element (the host overlay) are not
  // rendered. Fullscreen the document instead and fake-expand this panel.
  const isFullscreen =
    fullscreenRequested && fullscreenElement === document.documentElement;
  const toggleFullscreen = () => {
    if (document.fullscreenElement !== null) {
      void document.exitFullscreen();
      setFullscreenRequested(false);
      return;
    }
    void document.documentElement.requestFullscreen();
    setFullscreenRequested(true);
  };
  const [localPath, setLocalPath] = useSessionStorage(pathStorageKey, "/", {
    serializer: (value) => value,
    deserializer: (value) => normalizePreviewPath(value),
  });
  const viewportStorageKey = `${pathStorageKey}:viewport`;
  const [viewport, setViewport] = useSessionStorage<PreviewViewport>(
    viewportStorageKey,
    readStoredPreviewViewport(
      viewportStorageKey,
      `${pathStorageKey}:device`,
    ),
    {
      serializer: serializePreviewViewport,
      deserializer: parsePreviewViewport,
    },
  );
  const [aspectKey, setAspectKey] = useState(pathStorageKey);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  if (aspectKey !== pathStorageKey) {
    setAspectKey(pathStorageKey);
    setAspectRatio(null);
  }
  const previewPath = normalizePreviewPath(stickyPath ?? localPath);

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
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconWorld className="w-12 h-12 opacity-50" />
          <p className="text-sm">
            {!isActive
              ? "Wake Eva up to preview your app"
              : "Waiting for sandbox..."}
          </p>
          {!isActive && onStartSandbox ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={onStartSandbox}
              disabled={isSandboxStarting}
            >
              <IconPlayerPlay size={14} />
              {isSandboxStarting ? "Starting..." : "Wake up Eva"}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  function handleToggleDevice() {
    if (viewport.mode !== "fill") {
      setViewport(FILL_PREVIEW_VIEWPORT);
      setAspectRatio(null);
      return;
    }
    const rect = iframeElement?.getBoundingClientRect();
    setViewport(
      snapshotFillViewport({
        width: rect?.width ?? 1280,
        height: rect?.height ?? 800,
      }),
    );
  }

  return (
    <WebPreview
      ref={containerRef}
      defaultUrl={iframeSrc ?? ""}
      className={cn(
        "h-full rounded-none border-0",
        isFullscreen && "fixed inset-0 z-40 h-auto bg-background",
      )}
    >
      <PreviewPanelNavBar
        previewInfo={previewInfo}
        isLoading={isLoading}
        onRefresh={onRefresh}
        containerRef={containerRef}
        iframeElement={iframeElement}
        onToggleFullscreen={toggleFullscreen}
        port={port}
        onPortChange={onPortChange}
        previewPath={previewPath}
        onPathChange={handlePathChange}
        viewport={viewport}
        onToggleDevice={handleToggleDevice}
        annotationMode={annotationMode}
        onAnnotationModeChange={setAnnotationMode}
        showAnnotationToggle={Boolean(onAnnotationSubmit)}
      />
      {viewport.mode !== "fill" ? (
        <PreviewDeviceToolbar
          viewport={viewport}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          onChange={setViewport}
          onFill={() => {
            setViewport(FILL_PREVIEW_VIEWPORT);
            setAspectRatio(null);
          }}
        />
      ) : null}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <PreviewViewportFrame
          viewport={viewport}
          aspectRatio={aspectRatio}
          onResize={(size) =>
            setViewport({
              mode: "freeform",
              width: size.width,
              height: size.height,
            })
          }
        >
          <PersistentPreviewBody
            entryKey={pathStorageKey}
            group={`${sandboxId}:${port}`}
            src={iframeSrc}
            epoch={iframeKey}
            covered={error !== null}
            logicalSize={
              viewport.mode === "fill"
                ? null
                : { width: viewport.width, height: viewport.height }
            }
            loading={
              isLoading && !previewInfo ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary">
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
        </PreviewViewportFrame>
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
