import { useCallback, useMemo, useRef, useState } from "react";
import {
  Spinner,
  Button,
  WebPreview,
  WebPreviewNavigation,
  WebPreviewBody,
  useWebPreview,
} from "@conductor/ui";
import { useSessionStorage } from "usehooks-ts";
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
  const [previewPath, setPreviewPath] = useSessionStorage(pathStorageKey, "/", {
    serializer: (value) => value,
    deserializer: (value) => normalizePreviewPath(value),
  });

  // iframeSrc is recomputed only at remount points (previewInfo change,
  // storage-key change, or iframeKey bump from a refresh). previewPath is
  // intentionally excluded from deps so the src stays stable while the user
  // navigates inside the iframe — otherwise we'd fight the iframe with
  // declarative src updates.
  const iframeSrc = useMemo(() => {
    if (!previewInfo) return undefined;
    return buildUrlWithPath(previewInfo.url, previewPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewInfo, pathStorageKey, iframeKey]);

  const handlePathChange = useCallback(
    (path: string) => {
      setPreviewPath(normalizePreviewPath(path));
    },
    [setPreviewPath],
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
