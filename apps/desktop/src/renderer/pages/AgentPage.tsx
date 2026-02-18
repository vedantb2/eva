import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@conductor/ui";
import { IconGitBranch, IconRefresh } from "@tabler/icons-react";
import { AgentTerminal } from "../components/agents/AgentTerminal";
import { DiffViewer } from "../components/diff/DiffViewer";
import type { AgentInfo, DiffFile } from "../../preload/types";

export function AgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [diffs, setDiffs] = useState<DiffFile[]>([]);
  const [diffLoading, setDiffLoading] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    window.electronAPI.agentList().then((all) => {
      setAgent(all.find((a) => a.agentId === agentId) ?? null);
    });
  }, [agentId]);

  const refreshDiff = useCallback(async () => {
    if (!agent) return;
    setDiffLoading(true);
    try {
      const result = await window.electronAPI.gitDiff(
        agent.repoPath,
        agent.branchName,
      );
      setDiffs(result);
    } finally {
      setDiffLoading(false);
    }
  }, [agent]);

  if (!agentId) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Minimal header — branch info only, navigation is via sidebar */}
      {agent && (
        <header className="flex items-center gap-1.5 px-3 h-8 border-b border-border shrink-0">
          <IconGitBranch size={12} className="text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground truncate">
            {agent.branchName}
          </span>
        </header>
      )}

      <Tabs defaultValue="terminal" className="flex flex-col flex-1 min-h-0">
        <TabsList className="shrink-0 rounded-none border-b border-border px-3 justify-start h-9 bg-transparent gap-0">
          <TabsTrigger
            value="terminal"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
          >
            Terminal
          </TabsTrigger>
          <TabsTrigger
            value="diff"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
            onClick={refreshDiff}
          >
            Diff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terminal" className="flex-1 min-h-0 mt-0">
          {agent ? (
            <AgentTerminal ptyId={agent.ptyId} cwd={agent.worktreePath} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Agent not found
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="diff"
          className="flex-1 min-h-0 mt-0 overflow-y-auto"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                {diffs.length} file{diffs.length !== 1 ? "s" : ""} changed
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={refreshDiff}
                disabled={diffLoading}
              >
                <IconRefresh
                  size={12}
                  className={diffLoading ? "animate-spin" : ""}
                />
              </Button>
            </div>
            <DiffViewer files={diffs} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
