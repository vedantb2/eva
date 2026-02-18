import { useState } from "react";
import { nanoid } from "nanoid";
import {
  Button,
  Checkbox,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";
import { IconArrowUp, IconFolder } from "@tabler/icons-react";
import type { AgentInfo } from "../../../preload/types";

const MODELS = [
  { value: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { value: "claude-opus-4-6", label: "Opus 4.6" },
  { value: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
];

interface ChatInputProps {
  onSpawned: (agent: AgentInfo) => void;
}

export function ChatInput({ onSpawned }: ChatInputProps) {
  const [repoPath, setRepoPath] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [useWorktree, setUseWorktree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateBranchName(): string {
    const slug = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join("-");
    return `agent/${slug || "task"}-${nanoid(4)}`;
  }

  async function handlePickFolder() {
    const selected = await window.electronAPI.openDirectory();
    if (selected) {
      setRepoPath(selected);
    }
  }

  async function handleSpawn() {
    if (!repoPath.trim() || !prompt.trim()) return;

    const agentId = nanoid();
    const branchName = useWorktree ? generateBranchName() : "";

    setLoading(true);
    setError(null);

    try {
      await window.electronAPI.agentSpawn({
        agentId,
        repoPath: repoPath.trim(),
        branchName,
        baseBranch: useWorktree ? baseBranch.trim() || "main" : "",
        prompt: prompt.trim(),
        model,
        useWorktree,
      });

      onSpawned({
        agentId,
        repoPath: repoPath.trim(),
        branchName,
        worktreePath: "",
        ptyId: `agent-pty-${agentId}`,
        status: "running",
        startedAt: Date.now(),
        prompt: prompt.trim(),
      });

      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to spawn agent");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSpawn();
    }
  }

  const folderName = repoPath ? repoPath.split(/[/\\]/).pop() : null;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-center text-foreground">
          What do you want to build?
        </h1>

        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <Textarea
            placeholder="Describe the task for the agent..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
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
            {useWorktree && (
              <Input
                placeholder="main"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="h-7 text-xs w-20 shrink-0"
              />
            )}
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-7 text-xs w-32 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={loading || !prompt.trim() || !repoPath.trim()}
              onClick={handleSpawn}
            >
              <IconArrowUp size={14} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="use-worktree"
              checked={useWorktree}
              onCheckedChange={(checked) => setUseWorktree(checked === true)}
            />
            <label
              htmlFor="use-worktree"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Create worktree
            </label>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          ⌘ + Enter to spawn
        </p>
      </div>
    </div>
  );
}
