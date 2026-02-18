import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Textarea } from "@conductor/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";
import { IconFolder, IconArrowUp } from "@tabler/icons-react";
import { useSessionContext } from "../contexts/SessionContext";
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
  const { createSession } = useSessionContext();
  const [repoPath, setRepoPath] = useState("");
  const [tool, setTool] = useState<ToolType>("claude");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        <p className="text-xs text-muted-foreground text-center">
          Select a folder to open an interactive terminal session
        </p>
      </div>
    </div>
  );
}
