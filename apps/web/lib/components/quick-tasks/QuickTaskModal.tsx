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
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { IconFileText, IconTrash } from "@tabler/icons-react";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickTaskModal({ isOpen, onClose }: QuickTaskModalProps) {
  const { repo } = useRepo();
  const defaultBranch = repo.defaultBaseBranch ?? "main";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baseBranch, setBaseBranch] = useState(defaultBranch);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<Id<"taskDrafts"> | null>(
    null,
  );

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const saveDraft = useMutation(api.taskDrafts.save);
  const removeDraft = useMutation(api.taskDrafts.remove);
  const drafts = useQuery(api.taskDrafts.list, { repoId: repo._id });

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
    resetForm,
    onClose,
  ]);

  const handleSubmit = async () => {
    if (!title.trim() || !baseBranch || !repo) return;

    setIsLoading(true);
    try {
      await createQuickTask({
        repoId: repo._id,
        title: title.trim(),
        description: description.trim() || undefined,
        baseBranch,
        model: repo.defaultModel,
      });
      if (activeDraftId) {
        await removeDraft({ id: activeDraftId });
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

  const handleDeleteDraft = async (
    e: React.MouseEvent,
    draftId: Id<"taskDrafts">,
  ) => {
    e.stopPropagation();
    await removeDraft({ id: draftId });
    if (activeDraftId === draftId) {
      resetForm();
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
          <DialogTitle>
            {activeDraftId ? "Continue Draft" : "New Quick Task"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add more details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={12}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Base Branch <span className="text-destructive">*</span>
            </label>
            <BranchSelect
              value={baseBranch}
              onValueChange={setBaseBranch}
              placeholder="Select a branch"
              className="h-10"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
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
                      <button
                        key={draft._id}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors group"
                        onClick={() => loadDraft(draft)}
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
                          onClick={(e) => handleDeleteDraft(e, draft._id)}
                        >
                          <IconTrash size={14} />
                        </button>
                      </button>
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
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !title.trim() || !baseBranch}
            >
              {isLoading && <Spinner size="sm" />}
              Create Task
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
