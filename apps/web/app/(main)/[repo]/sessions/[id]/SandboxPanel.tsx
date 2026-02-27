"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { sandboxTabParser } from "@/lib/search-params";
import { Tabs, TabsList, TabsTrigger, Button } from "@conductor/ui";
import {
  IconDeviceDesktop,
  IconGitBranch,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { DesktopStreamPanel } from "./DesktopStreamPanel";
import { DiffPanel } from "./DiffPanel";

type Session = NonNullable<FunctionReturnType<typeof api.sessions.get>>;

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
  sandboxId,
  isActive,
  fileDiffs,
  chatVisible,
  onToggleChat,
  repoId,
}: SandboxPanelProps) {
  const [activeTab, setActiveTab] = useQueryState("tab", sandboxTabParser);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getDesktopStreamUrl = useAction(api.sandbox.getDesktopStreamUrl);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchStream = useCallback(async () => {
    if (!sandboxId || !isActive) return;
    setIsLoading(true);
    setError(null);
    stopPolling();
    try {
      const data = await getDesktopStreamUrl({ sandboxId, repoId });
      setStreamUrl(data.url);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not running")) {
        pollingRef.current = setTimeout(() => {
          fetchStream();
        }, 3000);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load desktop stream",
        );
        setIsLoading(false);
      }
    }
  }, [sandboxId, isActive, getDesktopStreamUrl, stopPolling, repoId]);

  useEffect(() => {
    if (isActive && sandboxId) {
      fetchStream();
    }
    return stopPolling;
  }, [isActive, sandboxId, fetchStream, stopPolling]);

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
          if (v === "desktop" || v === "diffs") {
            setActiveTab(v);
          }
        }}
      >
        <TabsList className="gap-1">
          <TabsTrigger value="desktop">
            <IconDeviceDesktop className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="diffs">
            <IconGitBranch className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex-1 overflow-hidden">
        <div className={activeTab === "desktop" ? "h-full" : "hidden"}>
          <DesktopStreamPanel
            isActive={isActive}
            sandboxId={sandboxId}
            streamUrl={streamUrl}
            isLoading={isLoading}
            error={error}
            onRefresh={fetchStream}
            tabSwitcher={tabSwitcher}
          />
        </div>
        <div className={activeTab === "diffs" ? "h-full" : "hidden"}>
          <DiffPanel fileDiffs={fileDiffs} tabSwitcher={tabSwitcher} />
        </div>
      </div>
    </div>
  );
}
