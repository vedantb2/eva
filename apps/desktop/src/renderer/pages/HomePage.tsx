import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Textarea } from "@conductor/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";
import { IconFolder, IconArrowUp, IconHistory } from "@tabler/icons-react";
import { useSessionActions } from "../contexts/SessionContext";
import type { ToolType } from "../../preload/types";

const TOOL_VALUES = ["claude", "opencode", "codex"] satisfies ToolType[];

const TOOLS: { value: ToolType; label: string }[] = [
  { value: "claude", label: "Claude Code" },
  { value: "opencode", label: "OpenCode" },
  { value: "codex", label: "Codex" },
];

function isToolType(v: string): v is ToolType {
  return (TOOL_VALUES as readonly string[]).includes(v);
}

export function HomePage() {
  const navigate = useNavigate();
  const { createSession } = useSessionActions();
  const [repoPath, setRepoPath] = useState("");
  const [tool, setTool] = useState<ToolType>("claude");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRepos, setRecentRepos] = useState<string[]>([]);

  useEffect(() => {
    window.electronAPI.recentRepos(5).then(setRecentRepos);
  }, []);

  async function handlePickFolder() {
    const selected = await window.electronAPI.openDirectory();
    if (selected) setRepoPath(selected);
  }

  async function handleSubmit() {
    if (!repoPath.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const session = await createSession({
        repoPath: repoPath.trim(),
        tool,
        initialMessage: message.trim() || undefined,
      });
      navigate(`/session/${session.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleRecentRepoClick(path: string) {
    setRepoPath(path);
  }

  const folderName = repoPath ? repoPath.split(/[/\\]/).pop() : null;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-center text-foreground">
          Start a new session
        </h1>

        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <Textarea
            placeholder="What do you want to work on? (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className="resize-none border-none shadow-none focus-visible:ring-0 p-0 text-sm bg-transparent"
          />

          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 flex-1 min-w-0 justify-start"
              onClick={handlePickFolder}
            >
              <IconFolder size={14} className="shrink-0" />
              {folderName ? (
                <span className="truncate" title={repoPath}>
                  {folderName}
                </span>
              ) : (
                <span className="text-muted-foreground">Select folder</span>
              )}
            </Button>
            <Select
              value={tool}
              onValueChange={(v) => {
                if (isToolType(v)) setTool(v);
              }}
            >
              <SelectTrigger className="h-7 text-xs w-36 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOOLS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={loading || !repoPath.trim()}
              onClick={handleSubmit}
            >
              <IconArrowUp size={14} />
            </Button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {recentRepos.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconHistory size={12} />
              <span>Recent</span>
            </div>
            <div className="flex flex-col gap-1">
              {recentRepos.map((path) => (
                <button
                  key={path}
                  onClick={() => handleRecentRepoClick(path)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
                >
                  <IconFolder size={12} className="shrink-0" />
                  <span className="truncate">{path}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Select a folder to open an interactive terminal session
        </p>
      </div>
    </div>
  );
}
