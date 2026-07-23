import { useMemo, useRef, useState } from "react";
import { Spinner, Button, WebPreview, WebPreviewBody } from "@conductor/ui";
import { useSessionStorage } from "usehooks-ts";
import {
  IconAlertTriangle,
  IconPlayerPlay,
  IconRefresh,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
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
  /**
   * Vercel sandbox name when the sandbox runs on Vercel. Used only to hide the
   * Preview auth hint: Vercel previews go through the auth proxy
   * and never show that "Accept" warning, so the hint is noise there.
   */
  vercelSandboxId: string | undefined;
  previewInfo: PreviewInfo | null;
  isLoading: boolean;
  error: string | null;
  iframeKey: number;
  onRefresh: () => void;
  port: number;
  onPortChange: (port: number) => void;
  pathStorageKey: string;
  /** When set, inactive empty state shows a Start sandbox button (tasks/projects/sessions). */
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
  vercelSandboxId,
  previewInfo,
  isLoading,
  error,
  iframeKey,
  onRefresh,
  port,
  onPortChange,
  pathStorageKey,
  onStartSandbox,
  isSandboxStarting = false,
  onAnnotationSubmit,
}: WebPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [warningHintDismissed, setWarningHintDismissed] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [previewPath, setPreviewPath] = useSessionStorage(pathStorageKey, "/", {
    serializer: (value) => value,
    deserializer: (value) => normalizePreviewPath(value),
  });
  const [device, setDevice] = useSessionStorage<PreviewDevice>(
    `${pathStorageKey}:device`,
    "desktop",
  );

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
    setPreviewPath(normalizePreviewPath(path));
  }

  if (!isActive || !sandboxId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconWorld className="w-12 h-12 opacity-50" />
          <p className="text-sm">
            {!isActive
              ? "Start the sandbox to preview your app"
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
              {isSandboxStarting ? "Starting..." : "Start sandbox"}
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
      {!warningHintDismissed && !vercelSandboxId ? (
        <div className="flex items-start gap-2 bg-warning/10 px-3 py-2 text-xs text-warning">
          <IconAlertTriangle size={14} className="mt-0.5 shrink-0" />
          <p className="flex-1 leading-relaxed">
            If you see a preview warning, click Accept, then click the refresh
            button in the address bar above.
          </p>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 shrink-0 text-warning/70 hover:bg-warning/20 hover:text-warning"
            onClick={() => setWarningHintDismissed(true)}
          >
            <IconX size={12} />
          </Button>
        </div>
      ) : null}
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
