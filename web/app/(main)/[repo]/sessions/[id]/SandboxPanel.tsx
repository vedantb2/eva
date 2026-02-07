"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@conductor/ui";
import { IconTerminal2, IconWorld, IconGitBranch } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { TerminalPanel } from "./TerminalPanel";
import { WebPreviewPanel } from "./WebPreviewPanel";
import { DiffPanel } from "./DiffPanel";

type Session = NonNullable<FunctionReturnType<typeof api.sessions.get>>;

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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="gap-2">
            <TabsTrigger value="preview">
              <div className="flex items-center gap-1.5">
                <IconWorld className="w-4 h-4" />
                <span>Preview</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="terminal">
              <div className="flex items-center gap-1.5">
                <IconTerminal2 className="w-4 h-4" />
                <span>Terminal</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="diffs">
              <div className="flex items-center gap-1.5">
                <IconGitBranch className="w-4 h-4" />
                <span>Diffs</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className={activeTab === "preview" ? "h-full" : "hidden"}>
          <WebPreviewPanel
            sessionId={sessionId}
            sandboxId={sandboxId}
            isActive={isActive}
          />
        </div>
        <div className={activeTab === "terminal" ? "h-full" : "hidden"}>
          <TerminalPanel
            sessionId={sessionId}
            sandboxId={sandboxId}
            isActive={isActive}
          />
        </div>
        <div className={activeTab === "diffs" ? "h-full" : "hidden"}>
          <DiffPanel fileDiffs={fileDiffs} />
        </div>
      </div>
    </div>
  );
}
