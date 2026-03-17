"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Textarea, Button } from "@conductor/ui";

export function McpConfigClient() {
  const { repo, repoId } = useRepo();
  const updateMcpRootPrompt = useMutation(api.githubRepos.updateMcpRootPrompt);

  const [value, setValue] = useState(repo.mcpRootPrompt ?? "");
  const [saving, setSaving] = useState(false);

  const isDirty = value !== (repo.mcpRootPrompt ?? "");

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateMcpRootPrompt({
        repoId,
        mcpRootPrompt: value.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }, [updateMcpRootPrompt, repoId, value]);

  return (
    <PageWrapper title="MCP Config">
      <div className="space-y-4">
        <div className="rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4">
          <div>
            <h3 className="text-sm font-medium">Root Prompt</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Freeform instructions injected into MCP server context to guide
              the AI on your data topology. Shared across all apps in a
              monorepo.
            </p>
          </div>

          <Textarea
            className="min-h-[200px] text-xs font-mono"
            placeholder="Describe your repo's data topology, table relationships, or any context the MCP server should know..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2">
            {isDirty && (
              <span className="text-[11px] text-muted-foreground">
                Unsaved changes
              </span>
            )}
            <Button
              size="sm"
              className="h-8"
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
