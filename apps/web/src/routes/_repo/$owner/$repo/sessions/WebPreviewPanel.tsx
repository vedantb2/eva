import { useRef } from "react";
import {
  Spinner,
  Button,
  WebPreview,
  WebPreviewNavigation,
  WebPreviewBody,
  useWebPreview,
} from "@conductor/ui";
import { IconRefresh, IconWorld } from "@tabler/icons-react";
import { PreviewNavBar } from "@/lib/components/PreviewNavBar";

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
}

function NavigationBar({
  previewInfo,
  isLoading,
  onRefresh,
  containerRef,
  port,
  onPortChange,
}: {
  previewInfo: PreviewInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  port: number;
  onPortChange: (port: number) => void;
}) {
  const { iframeRef } = useWebPreview();

  return (
    <WebPreviewNavigation>
      <PreviewNavBar
        previewUrl={previewInfo?.url ?? null}
        iframeRef={iframeRef}
        containerRef={containerRef}
        port={port}
        onPortChange={onPortChange}
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
}: WebPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      defaultUrl={previewInfo?.url ?? ""}
      className="h-full rounded-none border-0"
    >
      <NavigationBar
        previewInfo={previewInfo}
        isLoading={isLoading}
        onRefresh={onRefresh}
        containerRef={containerRef}
        port={port}
        onPortChange={onPortChange}
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
