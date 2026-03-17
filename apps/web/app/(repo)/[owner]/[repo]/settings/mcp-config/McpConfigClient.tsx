"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
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
} from "@conductor/ui";
import { IconPencil } from "@tabler/icons-react";

export function McpConfigClient() {
  const { repo, repoId } = useRepo();
  const updateMcpRootPrompt = useMutation(api.githubRepos.updateMcpRootPrompt);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const prompt = repo.mcpRootPrompt ?? "";

  const handleOpen = useCallback(() => {
    setDraft(prompt);
    setOpen(true);
  }, [prompt]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateMcpRootPrompt({
        repoId,
        mcpRootPrompt: draft.trim() || undefined,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }, [updateMcpRootPrompt, repoId, draft]);

  const isDirty = draft !== prompt;

  return (
    <PageWrapper title="MCP Config">
      <div className="space-y-4">
        <div className="rounded-lg bg-muted/40 p-3 space-y-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">Root Prompt</h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Freeform instructions injected into MCP server context to guide
                the AI on your data topology. Shared across all apps in a
                monorepo.
              </p>
            </div>

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
          </div>

          {prompt ? (
            <pre className="whitespace-pre-wrap text-xs font-mono text-foreground/80 leading-relaxed">
              {prompt}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No root prompt configured.
            </p>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
