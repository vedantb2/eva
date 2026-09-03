"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SettingsPage } from "@/lib/components/settings/SettingsPage";
import {
  Textarea,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@eva/ui";
import { IconPencil } from "@tabler/icons-react";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { withMutationToast } from "@/lib/utils/mutationToast";

type McpToolMode = "flat" | "code";

const TOOL_MODE_OPTIONS: ReadonlyArray<{
  value: McpToolMode;
  label: string;
  description: string;
}> = [
  {
    value: "flat",
    label: "Flat tools",
    description: "Every Eva action is its own MCP tool. Default.",
  },
  {
    value: "code",
    label: "Code mode",
    description:
      "One execute tool runs JavaScript against the same actions in a sandbox, plus search_tools for discovery. Fewer round trips, less context.",
  },
];

export function McpConfigClient() {
  const { repo, repoId } = useRepo();
  const updateMcpRootPrompt = useMutation(api.githubRepos.updateMcpRootPrompt);
  const updateMcpToolMode = useMutation(api.githubRepos.updateMcpToolMode);

  // The repo document is the source of truth; the select writes straight
  // through and re-renders from the subscription.
  const toolMode: McpToolMode = repo.mcpToolMode ?? "flat";
  const toolModeOption =
    TOOL_MODE_OPTIONS.find((option) => option.value === toolMode) ??
    TOOL_MODE_OPTIONS[0];

  const handleToolModeChange = (value: string) => {
    const next = TOOL_MODE_OPTIONS.find((option) => option.value === value);
    if (!next || next.value === toolMode) return;
    // Rejections already surface as the error toast; nothing else to do here.
    withMutationToast(
      updateMcpToolMode({
        repoId,
        mcpToolMode: next.value === "flat" ? undefined : next.value,
      }),
      "Tool mode saved",
      "Couldn't save tool mode",
      "mcp-tool-mode-save",
    ).catch(() => undefined);
  };

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const prompt = repo.mcpRootPrompt ?? "";

  const handleOpen = () => {
    setDraft(prompt);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    // Built before the try: React Compiler bails on the whole file when a
    // logical expression sits inside a try/catch.
    const trimmedPrompt = draft.trim() || undefined;
    try {
      await withMutationToast(
        updateMcpRootPrompt({
          repoId,
          mcpRootPrompt: trimmedPrompt,
        }),
        "Root prompt saved",
        "Couldn't save root prompt",
        "mcp-root-prompt-save",
      );
      setOpen(false);
    } catch {
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  const isDirty = draft !== prompt;

  return (
    <SettingsPage title="MCP Config">
      <SettingsSection
        title="Root prompt"
        description="Shared instructions injected into MCP context."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0"
                onClick={handleOpen}
              >
                <IconPencil size={14} />
                Edit
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit root prompt</DialogTitle>
                <DialogDescription>
                  Shared instructions injected into MCP context.
                </DialogDescription>
              </DialogHeader>

              <DialogBody>
                <Textarea
                  className="min-h-[280px] text-xs font-mono"
                  placeholder="Describe your repo's data topology, table relationships, or any context the MCP server should know..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </DialogBody>

              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        {prompt ? (
          // Nested inside the card, so the prompt steps to the muted tone.
          <pre className="whitespace-pre-wrap max-sm:wrap-break-word rounded-control border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground/80">
            {prompt}
          </pre>
        ) : (
          <p className="text-xs text-muted-foreground">
            No root prompt configured. Select Edit to add one.
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        title="Tool mode"
        description="How sandbox agents see the Eva MCP tools."
        action={
          <Select value={toolMode} onValueChange={handleToolModeChange}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOOL_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <p className="text-xs text-muted-foreground">
          {toolModeOption.description}
        </p>
      </SettingsSection>
    </SettingsPage>
  );
}
