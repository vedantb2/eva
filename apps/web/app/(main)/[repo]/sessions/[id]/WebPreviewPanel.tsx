"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  Spinner,
  Button,
  Input,
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
  port: number;
  onPortChange: (port: number) => void;
  isVnc: boolean;
}

function SyncPreviewUrl({ url }: { url: string | undefined }) {
  const { setUrl } = useWebPreview();
  const prevUrl = useRef(url);

  useEffect(() => {
    if (url && url !== prevUrl.current) {
      prevUrl.current = url;
      setUrl(url);
    }
  }, [url, setUrl]);

  return null;
}

function NavigationButtons({
  previewInfo,
  isLoading,
  onRefresh,
  containerRef,
  tabSwitcher,
  port,
  onPortChange,
  isVnc,
}: {
  previewInfo: PreviewInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  tabSwitcher?: ReactNode;
  port: number;
  onPortChange: (port: number) => void;
  isVnc: boolean;
}) {
  const { goBack, goForward, reload } = useWebPreview();
  const [inputValue, setInputValue] = useState(String(port));

  function commit() {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
      onPortChange(parsed);
    } else {
      setInputValue(String(port));
    }
  }

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
      <WebPreviewUrl className="h-8 text-xs flex-1 min-w-0" />
      {!isVnc && (
        <Input
          className="h-8 w-16 text-xs text-center px-1"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          aria-label="Preview port"
        />
      )}
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
  port,
  onPortChange,
  isVnc,
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
      <SyncPreviewUrl url={previewInfo?.url} />
      <NavigationButtons
        previewInfo={previewInfo}
        isLoading={isLoading}
        onRefresh={onRefresh}
        containerRef={containerRef}
        tabSwitcher={tabSwitcher}
        port={port}
        onPortChange={onPortChange}
        isVnc={isVnc}
      />
      <Group orientation="vertical" className="flex-1 min-h-0">
        <Panel
          id="web-preview"
          defaultSize={showConsole ? 70 : 100}
          minSize={20}
        >
          <WebPreviewBody
            key={iframeKey}
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
        {showConsole && (
          <>
            <Separator className="h-px bg-border hover:bg-primary/50 data-[resize-handle-active]:bg-primary transition-colors">
              <div className="flex items-center justify-center h-3 -my-1.5 relative z-10">
                <IconGripHorizontal className="w-4 h-4 text-muted-foreground/50" />
              </div>
            </Separator>
            <Panel id="web-console" defaultSize={30} minSize={10} maxSize={400}>
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
          </>
        )}
      </Group>
    </WebPreview>
  );
}
