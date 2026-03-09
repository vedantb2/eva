"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Textarea,
  Spinner,
} from "@conductor/ui";
import { useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { IconAlertCircle } from "@tabler/icons-react";

interface ImportLinearModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function parseLinearIdentifiers(text: string): string[] {
  const lines = text.split("\n");
  const identifiers = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const urlMatch = trimmed.match(/linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/i);
    if (urlMatch) {
      identifiers.add(urlMatch[1].toUpperCase());
      continue;
    }

    const idMatch = trimmed.match(/^([A-Z]+-\d+)$/i);
    if (idMatch) {
      identifiers.add(idMatch[1].toUpperCase());
    }
  }

  return Array.from(identifiers);
}

export function ImportLinearModal({ isOpen, onClose }: ImportLinearModalProps) {
  const { repo } = useRepo();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useAction(api.linearActions.fetchIssues);
  const createIssuesBatch = useMutation(api.agentTasks.createIssuesBatch);

  const identifiers = useMemo(() => parseLinearIdentifiers(input), [input]);

  const handleSubmit = async () => {
    if (identifiers.length === 0 || !repo) return;

    setIsLoading(true);
    setError(null);
    try {
      const issues = await fetchIssues({
        repoId: repo._id,
        identifiers,
      });

      if (issues.length === 0) {
        setError(
          "No issues found. Check that the identifiers are correct and you have access to them.",
        );
        return;
      }

      const tasks = issues.map((issue) => ({
        title: `${issue.identifier}: ${issue.title}`,
        description: issue.description || undefined,
      }));

      await createIssuesBatch({
        repoId: repo._id,
        tasks,
      });

      setInput("");
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Linear</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Linear URLs or Identifiers
            </label>
            <Textarea
              placeholder="Paste Linear URLs or identifiers (one per line)&#10;Example:&#10;https://linear.app/team/issue/TEAM-123/...&#10;TEAM-456"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              autoFocus
            />
            {identifiers.length > 0 && (
              <p className="text-sm text-muted-foreground break-words">
                {identifiers.length} issue{identifiers.length === 1 ? "" : "s"}{" "}
                detected: {identifiers.join(", ")}
              </p>
            )}
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              <IconAlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>{error}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || identifiers.length === 0}
          >
            {isLoading && <Spinner size="sm" />}
            Import {identifiers.length} Issue
            {identifiers.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
