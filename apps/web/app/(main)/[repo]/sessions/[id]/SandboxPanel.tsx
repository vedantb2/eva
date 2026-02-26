"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { sandboxTabParser } from "@/lib/search-params";
import { Tabs, TabsList, TabsTrigger, Button } from "@conductor/ui";
import {
  IconWorld,
  IconGitBranch,
  IconCode,
  IconLayoutBottombar,
  IconLayoutBottombarCollapse,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { TerminalPanel } from "./TerminalPanel";
import { WebPreviewPanel } from "./WebPreviewPanel";
import { DiffPanel } from "./DiffPanel";
import { EditorPanel } from "./EditorPanel";

type Session = NonNullable<FunctionReturnType<typeof api.sessions.get>>;

interface PreviewInfo {
  url: string;
  port: number;
}

interface SandboxPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
  fileDiffs: Session["fileDiffs"];
  chatVisible?: boolean;
  onToggleChat?: () => void;
  repoId: Id<"githubRepos">;
}

export function SandboxPanel({
  sessionId,
  sandboxId,
  isActive,
  fileDiffs,
  chatVisible,
  onToggleChat,
  repoId,
}: SandboxPanelProps) {
  const [activeTab, setActiveTab] = useQueryState("tab", sandboxTabParser);
  const [showConsole, setShowConsole] = useState(true);
  const [consoleTab, setConsoleTab] = useState<"console" | "terminal">(
    "terminal",
  );
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [port, setPort] = useState(3001);
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchPreview = useCallback(async () => {
    if (!sandboxId || !isActive) return;
    setIsLoading(true);
    setError(null);
    stopPolling();
    try {
      const data = await getPreviewUrl({
        sandboxId,
        port,
        checkReady: true,
        repoId,
      });
      if (data.ready) {
        setPreviewInfo(data);
        setIframeKey((k) => k + 1);
        setIsLoading(false);
      } else {
        pollingRef.current = setTimeout(() => {
          fetchPreview();
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
      setIsLoading(false);
    }
  }, [sandboxId, isActive, getPreviewUrl, stopPolling, repoId, port]);

  useEffect(() => {
    if (isActive && sandboxId) {
      fetchPreview();
    }
    return stopPolling;
  }, [isActive, sandboxId, fetchPreview, stopPolling]);

  const terminal = useMemo(
    () => (
      <TerminalPanel
        sessionId={sessionId}
        sandboxId={sandboxId}
        isActive={isActive}
      />
    ),
    [sessionId, sandboxId, isActive],
  );

  const tabSwitcher = (
    <div className="flex items-center gap-2">
      {onToggleChat && (
        <Button
          size="icon"
          variant="ghost"
          className="size-10 motion-press hover:scale-[1.03] active:scale-[0.97]"
          onClick={onToggleChat}
        >
          {chatVisible ? (
            <IconLayoutSidebarLeftCollapse className="size-4" />
          ) : (
            <IconLayoutSidebarLeftExpand className="size-4" />
          )}
        </Button>
      )}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (v === "preview" || v === "diffs" || v === "editor") {
            setActiveTab(v);
          }
        }}
      >
        <TabsList className="gap-1">
          <TabsTrigger value="preview">
            <IconWorld className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="diffs">
            <IconGitBranch className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="editor">
            <IconCode className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Button
        size="icon"
        variant={showConsole ? "default" : "secondary"}
        className="size-10"
        onClick={() => setShowConsole((current) => !current)}
      >
        {showConsole ? (
          <IconLayoutBottombar className="size-4" />
        ) : (
          <IconLayoutBottombarCollapse className="size-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex-1 overflow-hidden">
        <div className={activeTab === "preview" ? "h-full" : "hidden"}>
          <WebPreviewPanel
            isActive={isActive}
            sandboxId={sandboxId}
            previewInfo={previewInfo}
            isLoading={isLoading}
            error={error}
            iframeKey={iframeKey}
            onRefresh={fetchPreview}
            terminal={terminal}
            tabSwitcher={tabSwitcher}
            showConsole={showConsole}
            consoleTab={consoleTab}
            onConsoleTabChange={setConsoleTab}
            port={port}
            onPortChange={setPort}
          />
        </div>
        <div className={activeTab === "diffs" ? "h-full" : "hidden"}>
          <DiffPanel fileDiffs={fileDiffs} tabSwitcher={tabSwitcher} />
        </div>
        <div className={activeTab === "editor" ? "h-full" : "hidden"}>
          <EditorPanel
            sessionId={sessionId}
            sandboxId={sandboxId}
            isActive={isActive}
            tabSwitcher={tabSwitcher}
            repoId={repoId}
          />
        </div>
      </div>
    </div>
  );
}
