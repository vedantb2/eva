"use client";

import { useRef, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  Spinner,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
  WebPreviewBody,
  useWebPreview,
} from "@conductor/ui";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBug,
  IconRefresh,
  IconTerminal2,
  IconWorld,
  IconExternalLink,
  IconMaximize,
  IconGripHorizontal,
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
  showConsole: boolean;
  consoleTab: "console" | "terminal";
  onConsoleTabChange: (value: "console" | "terminal") => void;
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
  consoleTab,
  onConsoleTabChange,
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
      {showConsole ? (
        <Group orientation="vertical" className="flex-1 min-h-0">
          <Panel defaultSize="70%" minSize={80}>
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
          </Panel>
          <Separator className="h-px bg-border hover:bg-primary/50 data-[resize-handle-active]:bg-primary transition-colors">
            <div className="flex items-center justify-center h-3 -my-1.5 relative z-10">
              <IconGripHorizontal className="w-4 h-4 text-muted-foreground/50" />
            </div>
          </Separator>
          <Panel defaultSize="30%" minSize={80} maxSize={400}>
            <Tabs
              value={consoleTab}
              onValueChange={(value) => {
                if (value === "console" || value === "terminal") {
                  onConsoleTabChange(value);
                }
              }}
              className="h-full flex flex-col bg-muted/50 text-sm"
            >
              <TabsList className="h-9 w-full justify-start rounded-none border-b border-border/70 bg-transparent px-2 flex-shrink-0">
                <TabsTrigger
                  value="console"
                  className="gap-1.5 rounded-none px-3 text-xs"
                >
                  <IconBug className="h-3.5 w-3.5" />
                  Console
                </TabsTrigger>
                {terminal ? (
                  <TabsTrigger
                    value="terminal"
                    className="gap-1.5 rounded-none px-3 text-xs"
                  >
                    <IconTerminal2 className="h-3.5 w-3.5" />
                    Terminal
                  </TabsTrigger>
                ) : null}
              </TabsList>
              <TabsContent
                forceMount
                value="console"
                className="mt-0 flex-1 min-h-0 overflow-y-auto scrollbar px-4 py-3 font-mono data-[state=inactive]:hidden"
              >
                <p className="text-xs text-muted-foreground">
                  No console output
                </p>
              </TabsContent>
              {terminal ? (
                <TabsContent
                  forceMount
                  value="terminal"
                  className="mt-0 flex-1 min-h-0 overflow-hidden data-[state=inactive]:hidden"
                >
                  {terminal}
                </TabsContent>
              ) : null}
            </Tabs>
          </Panel>
        </Group>
      ) : (
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
      )}
    </WebPreview>
  );
}
