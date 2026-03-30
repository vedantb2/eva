"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { IconFileText, IconTrash } from "@tabler/icons-react";
import { useHotkey } from "@tanstack/react-hotkeys";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: Id<"projects">;
}

export function QuickTaskModal({
  isOpen,
  onClose,
  projectId,
}: QuickTaskModalProps) {
  const { repo } = useRepo();
  const defaultBranch = repo.defaultBaseBranch ?? "main";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baseBranch, setBaseBranch] = useState(defaultBranch);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<Id<"agentTasks"> | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] =
    useState<Id<"agentTasks"> | null>(null);

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const saveDraft = useMutation(api.agentTasks.saveDraft);
  const activateDraft = useMutation(api.agentTasks.activateDraft);
  const removeDraft = useMutation(api.agentTasks.remove);
  const drafts = useQuery(api.agentTasks.listDrafts, { repoId: repo._id });

  const hasContent = title.trim() || description.trim();

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setBaseBranch(defaultBranch);
    setActiveDraftId(null);
  }, [defaultBranch]);

  const handleClose = useCallback(async () => {
    if (hasContent) {
      await saveDraft({
        id: activeDraftId ?? undefined,
        repoId: repo._id,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        baseBranch,
        projectId,
      });
    }
    resetForm();
    onClose();
  }, [
    hasContent,
    saveDraft,
    activeDraftId,
    repo._id,
    title,
    description,
    baseBranch,
    projectId,
    resetForm,
    onClose,
  ]);

  const handleSubmit = async () => {
    if (!title.trim() || !baseBranch || !repo) return;

    setIsLoading(true);
    try {
      if (activeDraftId) {
        await activateDraft({
          id: activeDraftId,
          title: title.trim(),
          description: description.trim() || undefined,
          baseBranch,
          model: repo.defaultModel,
        });
      } else {
        await createQuickTask({
          repoId: repo._id,
          title: title.trim(),
          description: description.trim() || undefined,
          baseBranch,
          model: repo.defaultModel,
          projectId,
        });
      }
      resetForm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDraft = (draft: NonNullable<typeof drafts>[number]) => {
    setTitle(draft.title ?? "");
    setDescription(draft.description ?? "");
    setBaseBranch(draft.baseBranch ?? defaultBranch);
    setActiveDraftId(draft._id);
  };

  const handleDeleteDraft = async (draftId: Id<"agentTasks">) => {
    await removeDraft({ id: draftId });
    setConfirmDeleteId(null);
    if (activeDraftId === draftId) {
      resetForm();
    }
  };

  const canSubmit = !isLoading && !!title.trim() && !!baseBranch;

  useHotkey(
    "Mod+Enter",
    (e) => {
      e.preventDefault();
      if (canSubmit) {
        handleSubmit();
      }
    },
    { enabled: isOpen },
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {activeDraftId ? "Continue Draft" : "New Quick Task"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            placeholder="Add more details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="min-h-[120px] max-h-[50vh] sm:min-h-[200px]"
          />
          <BranchSelect
            value={baseBranch}
            onValueChange={setBaseBranch}
            placeholder="Select a base branch"
            className="h-10"
          />
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div>
            {drafts && drafts.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <IconFileText size={16} />
                    Drafts ({drafts.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-0">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium">Saved Drafts</p>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {drafts.map((draft) => (
                      <div key={draft._id}>
                        {confirmDeleteId === draft._id ? (
                          <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm bg-destructive/5">
                            <span className="text-destructive truncate">
                              Delete draft?
                            </span>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleDeleteDraft(draft._id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            role="button"
                            tabIndex={0}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors group cursor-pointer"
                            onClick={() => loadDraft(draft)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ")
                                loadDraft(draft);
                            }}
                          >
                            <span className="flex-1 truncate">
                              {draft.title || (
                                <span className="text-muted-foreground italic">
                                  Untitled
                                </span>
                              )}
                            </span>
                            <button
                              className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(draft._id);
                              }}
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isLoading && <Spinner size="sm" />}
              Create Task
              <kbd className="ml-1.5 text-xs opacity-60">⌘↵</kbd>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
