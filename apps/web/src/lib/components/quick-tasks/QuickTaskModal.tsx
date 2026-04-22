"use client";

import { useState, useCallback, useRef, lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  Button,
  Input,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ModelSelect,
  Badge,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
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
import type { FunctionReturnType } from "convex/server";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { BranchSelect } from "@/lib/components/BranchSelect";
import {
  IconFileText,
  IconTrash,
  IconUserPlus,
  IconFolder,
  IconGitBranch,
  IconTag,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { getUserInitials, UserInitials } from "@conductor/shared";
import { Facehash } from "facehash";
import type { MarkdownEditorHandle } from "@/lib/components/tasks/_components/MarkdownEditor";
import { getUserDisplayName } from "@/lib/components/tasks/_components/task-detail-constants";

const MarkdownEditor = lazy(() =>
  import("@/lib/components/tasks/_components/MarkdownEditor").then((m) => ({
    default: m.MarkdownEditor,
  })),
);

type User = FunctionReturnType<typeof api.users.listAll>[number];
type Project = FunctionReturnType<typeof api.projects.list>[number];

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: Id<"projects">;
  users?: User[];
  projects?: Project[];
  allTags?: string[];
}

export function QuickTaskModal({
  isOpen,
  onClose,
  projectId,
  users,
  projects,
  allTags,
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
  const [selectedProjectId, setSelectedProjectId] = useState<
    Id<"projects"> | undefined
  >(projectId);
  const [assignedTo, setAssignedTo] = useState<Id<"users"> | undefined>(
    undefined,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");

  const editorRef = useRef<MarkdownEditorHandle>(null);

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
    setSelectedProjectId(projectId);
    setAssignedTo(undefined);
    setSelectedTags([]);
    setTagSearch("");
  }, [defaultBranch, defaultModel, projectId]);

  const handleClose = useCallback(async () => {
    const desc = getDescription().trim();
    if (title.trim() || desc) {
      await saveDraft({
        id: activeDraftId ?? undefined,
        repoId: repo._id,
        title: title.trim() || undefined,
        description: desc || undefined,
        baseBranch,
        projectId: selectedProjectId,
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
    selectedProjectId,
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
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          assignedTo,
        });
      } else {
        await createQuickTask({
          repoId: repo._id,
          title: title.trim(),
          description: desc || undefined,
          baseBranch,
          model,
          projectId: selectedProjectId,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          assignedTo,
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
    setSelectedProjectId(draft.projectId ?? projectId);
    setSelectedTags(draft.tags ?? []);
  };

  const handleDeleteDraft = async (draftId: Id<"agentTasks">) => {
    await removeDraft({ id: draftId });
    setConfirmDeleteId(null);
    if (activeDraftId === draftId) {
      resetForm();
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const addCustomTag = (raw: string) => {
    const value = raw.trim();
    if (!value || selectedTags.includes(value)) return;
    setSelectedTags((prev) => [...prev, value]);
    setTagSearch("");
  };

  const canSubmit = !isLoading && !!title.trim() && !!baseBranch;

  const assignedUser = assignedTo
    ? users?.find((u) => u._id === assignedTo)
    : undefined;
  const selectedProject = selectedProjectId
    ? projects?.find((p) => p._id === selectedProjectId)
    : undefined;

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
      <DialogContent className="max-w-2xl gap-0 p-0" hideCloseButton>
        <div className="px-5 pt-5 pb-1">
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="border-0 shadow-none bg-transparent px-0 text-base font-medium focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="px-5 min-h-[160px] max-h-[50vh] overflow-y-auto">
          <Suspense
            fallback={
              <div className="p-3">
                <Spinner size="sm" />
              </div>
            }
          >
            <MarkdownEditor
              ref={editorRef}
              content={description}
              editable
              placeholder="Add description..."
              minHeight="min-h-[160px]"
              className="text-sm [&_.tiptap]:px-0 [&_.tiptap]:py-2"
              onBlur={(md) => setDescription(md)}
            />
          </Suspense>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-5 py-3 bg-muted/30">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                {assignedUser ? (
                  <>
                    <UserInitials user={assignedUser} size="sm" hideLastSeen />
                    <span className="text-foreground">
                      {getUserDisplayName(assignedUser)}
                    </span>
                  </>
                ) : (
                  <>
                    <IconUserPlus size={14} />
                    <span>Assignee</span>
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-0">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandList>
                  <CommandEmpty>No users found</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="unassigned"
                      onSelect={() => setAssignedTo(undefined)}
                    >
                      <IconUserPlus
                        size={14}
                        className="text-muted-foreground"
                      />
                      Unassigned
                      {!assignedTo && (
                        <IconCheck size={14} className="ml-auto" />
                      )}
                    </CommandItem>
                    {(users ?? []).map((user) => (
                      <CommandItem
                        key={user._id}
                        value={getUserDisplayName(user)}
                        onSelect={() => setAssignedTo(user._id)}
                      >
                        <Facehash
                          size={16}
                          name={getUserInitials(user)}
                          enableBlink
                        />
                        {getUserDisplayName(user)}
                        {assignedTo === user._id && (
                          <IconCheck size={14} className="ml-auto" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                <IconFolder size={14} />
                <span className={selectedProject ? "text-foreground" : ""}>
                  {selectedProject ? selectedProject.title : "Project"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-0">
              <Command>
                <CommandInput placeholder="Search projects..." />
                <CommandList>
                  <CommandEmpty>No projects found</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="no-project"
                      onSelect={() => setSelectedProjectId(undefined)}
                    >
                      No project
                      {!selectedProjectId && (
                        <IconCheck size={14} className="ml-auto" />
                      )}
                    </CommandItem>
                    {(projects ?? []).map((p) => (
                      <CommandItem
                        key={p._id}
                        value={p.title}
                        onSelect={() => setSelectedProjectId(p._id)}
                      >
                        <IconFolder
                          size={14}
                          className="text-muted-foreground"
                        />
                        {p.title}
                        {selectedProjectId === p._id && (
                          <IconCheck size={14} className="ml-auto" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                <IconGitBranch size={14} />
                <span className="text-foreground">{baseBranch}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <BranchSelect
                value={baseBranch}
                onValueChange={setBaseBranch}
                placeholder="Select a base branch"
                className="h-8 w-full"
              />
            </PopoverContent>
          </Popover>

          <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
            <ModelSelect
              value={model}
              options={modelOptions}
              onValueChange={setModel}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                <IconTag size={14} />
                {selectedTags.length > 0 ? (
                  <span className="text-foreground">
                    {selectedTags.length} tag
                    {selectedTags.length !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span>Tags</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0">
              <Command>
                <CommandInput
                  placeholder="Search or create tag..."
                  value={tagSearch}
                  onValueChange={setTagSearch}
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === ",") &&
                      tagSearch.trim()
                    ) {
                      e.preventDefault();
                      addCustomTag(tagSearch);
                    }
                  }}
                />
                <CommandList>
                  <CommandEmpty>
                    {tagSearch.trim() ? (
                      <button
                        type="button"
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                        onClick={() => addCustomTag(tagSearch)}
                      >
                        Create &quot;{tagSearch.trim()}&quot;
                      </button>
                    ) : (
                      "No tags"
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {(allTags ?? []).map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={() => toggleTag(tag)}
                      >
                        <IconTag size={14} className="text-muted-foreground" />
                        {tag}
                        {selectedTags.includes(tag) && (
                          <IconCheck size={14} className="ml-auto" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-1">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] h-5 gap-0.5 pr-0.5"
                >
                  {tag}
                  <button
                    type="button"
                    className="rounded-sm opacity-50 hover:opacity-100 transition-opacity ml-0.5 px-0.5"
                    onClick={() => toggleTag(tag)}
                  >
                    <IconX size={10} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 px-5 py-3 sm:flex-row sm:justify-between bg-muted/15">
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
