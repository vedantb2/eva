import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Spinner,
  Button,
  WebPreview,
  WebPreviewNavigation,
  WebPreviewBody,
  useWebPreview,
} from "@conductor/ui";
import {
  IconAlertTriangle,
  IconRefresh,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import {
  PreviewNavBar,
  buildUrlWithPath,
  normalizePreviewPath,
} from "@/lib/components/PreviewNavBar";

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
}

function readPreviewPath(storageKey: string): string {
  try {
    const stored = sessionStorage.getItem(storageKey);
    return stored ? normalizePreviewPath(stored) : "/";
  } catch {
    return "/";
  }
}

function writePreviewPath(storageKey: string, path: string): string {
  const normalized = normalizePreviewPath(path);
  try {
    sessionStorage.setItem(storageKey, normalized);
  } catch {
    // non-critical; the live preview path still updates in memory
  }
  return normalized;
}

function NavigationBar({
  previewInfo,
  isLoading,
  onRefresh,
  containerRef,
  port,
  onPortChange,
  previewPath,
  onPathChange,
}: {
  previewInfo: PreviewInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  port: number;
  onPortChange: (port: number) => void;
  previewPath: string;
  onPathChange: (path: string) => void;
}) {
  const { iframeRef } = useWebPreview();

  return (
    <WebPreviewNavigation>
      <PreviewNavBar
        previewUrl={previewInfo?.url ?? null}
        iframeRef={iframeRef}
        containerRef={containerRef}
        port={port}
        path={previewPath}
        onPortChange={onPortChange}
        onPathChange={onPathChange}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
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
  port,
  onPortChange,
  pathStorageKey,
}: WebPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [warningHintDismissed, setWarningHintDismissed] = useState(false);
  const [previewPath, setPreviewPath] = useState(() =>
    readPreviewPath(pathStorageKey),
  );

  useEffect(() => {
    setPreviewPath(readPreviewPath(pathStorageKey));
  }, [pathStorageKey]);

  // iframeSrc is recomputed only at remount points (previewInfo change,
  // storage-key change, or iframeKey bump from a refresh). Reading the path
  // from sessionStorage here — instead of from previewPath state — keeps the
  // src stable while the user navigates inside the iframe, so we don't fight
  // the iframe with declarative src updates.
  const iframeSrc = useMemo(() => {
    if (!previewInfo) return undefined;
    return buildUrlWithPath(previewInfo.url, readPreviewPath(pathStorageKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewInfo, pathStorageKey, iframeKey]);

  const handlePathChange = useCallback(
    (path: string) => {
      setPreviewPath(writePreviewPath(pathStorageKey, path));
    },
    [pathStorageKey],
  );

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
        </div>
      </div>
    );
  }

  return (
    <WebPreview
      ref={containerRef}
      defaultUrl={iframeSrc ?? ""}
      className="h-full rounded-none border-0"
    >
      <NavigationBar
        previewInfo={previewInfo}
        isLoading={isLoading}
        onRefresh={onRefresh}
        containerRef={containerRef}
        port={port}
        onPortChange={onPortChange}
        previewPath={previewPath}
        onPathChange={handlePathChange}
      />
      {!warningHintDismissed ? (
        <div className="flex items-start gap-2 bg-orange-500/10 px-3 py-2 text-xs text-orange-700 dark:text-orange-300">
          <IconAlertTriangle size={14} className="mt-0.5 shrink-0" />
          <p className="flex-1 leading-relaxed">
            If you see a preview warning, click Accept, then click the refresh
            button in the address bar above.
          </p>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 shrink-0 text-orange-700/70 hover:bg-orange-500/20 hover:text-orange-700 dark:text-orange-300/70 dark:hover:text-orange-300"
            onClick={() => setWarningHintDismissed(true)}
          >
            <IconX size={12} />
          </Button>
        </div>
      ) : null}
      <WebPreviewBody
        key={iframeKey}
        src={iframeSrc}
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
    </WebPreview>
  );
}
