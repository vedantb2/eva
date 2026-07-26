"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
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
} from "@eva/ui";
import { IconPencil } from "@tabler/icons-react";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";

export function McpConfigClient() {
  const { repo, repoId } = useRepo();
  const updateMcpRootPrompt = useMutation(api.githubRepos.updateMcpRootPrompt);

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
      await updateMcpRootPrompt({
        repoId,
        mcpRootPrompt: trimmedPrompt,
      });
      setOpen(false);
    } catch (error) {
      setSaving(false);
      throw error;
    }
    setSaving(false);
  };

  const isDirty = draft !== prompt;

  return (
    <PageWrapper title="MCP Config" comfortable>
      <div className="space-y-4">
        <SettingsSection
          title="Root Prompt"
          description="Freeform instructions injected into MCP server context to guide the AI on your data topology. Shared across all apps in a monorepo."
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
                  <DialogTitle>Edit Root Prompt</DialogTitle>
                  <DialogDescription>
                    Instructions injected into MCP server context. Shared across
                    all apps in a monorepo.
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
            <pre className="whitespace-pre-wrap rounded-control border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground/80">
              {prompt}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground">
              No root prompt configured. Select Edit to add one.
            </p>
          )}
        </SettingsSection>
      </div>
    </PageWrapper>
  );
}
