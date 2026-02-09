"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Tabs, TabsList, TabsTrigger } from "@conductor/ui";
import { IconTerminal2, IconWorld, IconGitBranch } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { TerminalPanel } from "./TerminalPanel";
import { WebPreviewPanel } from "./WebPreviewPanel";
import { DiffPanel } from "./DiffPanel";

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
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [terminalOpen, setTerminalOpen] = useState(false);
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

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between gap-2 p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="gap-1">
            <TabsTrigger value="preview">
              <IconWorld className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="diffs">
              <IconGitBranch className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant={terminalOpen ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setTerminalOpen(!terminalOpen)}
        >
          <IconTerminal2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div
          className={`overflow-hidden min-h-0 ${terminalOpen ? "h-1/2" : "flex-1"}`}
        >
          <div className={activeTab === "preview" ? "h-full" : "hidden"}>
            <WebPreviewPanel
              isActive={isActive}
              sandboxId={sandboxId}
              previewInfo={previewInfo}
              isLoading={isLoading}
              error={error}
              iframeKey={iframeKey}
              onRefresh={fetchPreview}
            />
          </div>
          <div className={activeTab === "diffs" ? "h-full" : "hidden"}>
            <DiffPanel fileDiffs={fileDiffs} />
          </div>
        </div>
        {terminalOpen && (
          <div className="h-1/2 min-h-0 overflow-hidden">
            <TerminalPanel
              sessionId={sessionId}
              sandboxId={sandboxId}
              isActive={isActive}
            />
          </div>
        )}
      </div>
    </div>
  );
}
