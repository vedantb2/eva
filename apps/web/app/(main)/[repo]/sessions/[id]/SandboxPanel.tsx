"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Spinner, Tabs, TabsList, TabsTrigger } from "@conductor/ui";
import {
  IconTerminal2,
  IconWorld,
  IconGitBranch,
  IconRefresh,
  IconExternalLink,
} from "@tabler/icons-react";
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
        {activeTab === "preview" && isActive && sandboxId && (
          <div className="flex-1 max-w-md flex items-center h-8 rounded-lg border border-border bg-secondary px-2 gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={fetchPreview}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <IconRefresh className="w-3.5 h-3.5" />
              )}
            </Button>
            <span className="flex-1 text-xs text-muted-foreground truncate select-all">
              {previewInfo?.url ?? "Loading..."}
            </span>
            {previewInfo && (
              <a
                href={previewInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <IconExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
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
              onRetry={fetchPreview}
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
