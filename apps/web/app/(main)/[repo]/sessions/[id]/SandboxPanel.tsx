"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useQueryState } from "nuqs";
import { sandboxTabParser } from "@/lib/search-params";
import { Tabs, TabsList, TabsTrigger, Button } from "@conductor/ui";
import {
  IconWorld,
  IconGitBranch,
  IconCode,
  IconLayoutBottombar,
  IconLayoutBottombarCollapse,
} from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
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
}

export function SandboxPanel({
  sessionId,
  sandboxId,
  isActive,
  fileDiffs,
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

  const fetchPreview = useCallback(async () => {
    if (!sandboxId || !isActive) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/sessions/preview?sessionId=${sessionId}&port=3000`,
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get preview URL");
      }
      const data = await response.json();
      setPreviewInfo(data);
      setIframeKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId, isActive, sessionId]);

  useEffect(() => {
    if (isActive && sandboxId) {
      fetchPreview();
    }
  }, [isActive, sandboxId, fetchPreview]);

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
    <div className="flex items-center gap-1">
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as "preview" | "diffs" | "editor");
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
        variant={showConsole ? "secondary" : "ghost"}
        className="h-7 w-7"
        onClick={() => setShowConsole((current) => !current)}
      >
        {showConsole ? (
          <IconLayoutBottombar className="w-4 h-4" />
        ) : (
          <IconLayoutBottombarCollapse className="w-4 h-4" />
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
          />
        </div>
      </div>
    </div>
  );
}
