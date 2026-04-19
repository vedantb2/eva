"use client";

import { useState, useCallback, useRef, lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ModelSelect,
} from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import {
  api,
  DEFAULT_AI_MODEL,
  normalizeAIModel,
  type AIModel,
} from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { IconFileText, IconTrash } from "@tabler/icons-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { FormattedTextHandle } from "@/lib/components/tasks/_components/FormattedText";

const FormattedText = lazy(() =>
  import("@/lib/components/tasks/_components/FormattedText").then((m) => ({
    default: m.FormattedText,
  })),
);

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

  const editorRef = useRef<FormattedTextHandle>(null);

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const saveDraft = useMutation(api.agentTasks.saveDraft);
  const activateDraft = useMutation(api.agentTasks.activateDraft);
  const removeDraft = useMutation(api.agentTasks.remove);
  const drafts = useQuery(api.agentTasks.listDrafts, { repoId: repo._id });
  const defaultModel = normalizeAIModel(repo.defaultModel ?? DEFAULT_AI_MODEL);
  const [model, setModel] = useState<AIModel>(defaultModel);
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);

  const getDescription = () => editorRef.current?.getMarkdown() ?? description;

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setBaseBranch(defaultBranch);
    setModel(defaultModel);
    setActiveDraftId(null);
  }, [defaultBranch, defaultModel]);

  const handleClose = useCallback(async () => {
    const desc = getDescription().trim();
    if (title.trim() || desc) {
      await saveDraft({
        id: activeDraftId ?? undefined,
        repoId: repo._id,
        title: title.trim() || undefined,
        description: desc || undefined,
        baseBranch,
        projectId,
      });
    }
    resetForm();
    onClose();
  }, [
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

    const desc = getDescription().trim();
    setIsLoading(true);
    try {
      if (activeDraftId) {
        await activateDraft({
          id: activeDraftId,
          title: title.trim(),
          description: desc || undefined,
          baseBranch,
          model,
        });
      } else {
        await createQuickTask({
          repoId: repo._id,
          title: title.trim(),
          description: desc || undefined,
          baseBranch,
          model,
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
          <div className="min-h-[120px] max-h-[50vh] sm:min-h-[200px] rounded-md bg-muted/40 overflow-y-auto">
            <Suspense
              fallback={
                <div className="p-3">
                  <Spinner size="sm" />
                </div>
              }
            >
              <FormattedText
                ref={editorRef}
                content={description}
                editable
                className="text-sm leading-7 [&_.tiptap]:outline-none [&_.tiptap]:min-h-[120px] [&_.tiptap]:px-3 [&_.tiptap]:py-2 [&_.tiptap_p]:my-0 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap:empty]:before:content-['Add_more_details_(optional)'] [&_.tiptap:empty]:before:text-muted-foreground [&_.tiptap:empty]:before:pointer-events-none"
                onBlur={(md) => setDescription(md)}
              />
            </Suspense>
          </div>
          <div className="flex items-center gap-2">
            <BranchSelect
              value={baseBranch}
              onValueChange={setBaseBranch}
              placeholder="Select a base branch"
              className="h-10 flex-1"
            />
            <ModelSelect
              value={model}
              options={modelOptions}
              onValueChange={setModel}
            />
          </div>
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
                              className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-[opacity,background-color,color]"
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
