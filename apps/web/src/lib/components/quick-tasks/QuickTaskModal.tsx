"use client";

import { useState, useCallback, useRef, useMemo } from "react";
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import {
  api,
  DEFAULT_AI_MODEL,
  normalizeAIModel,
  type AIModel,
  type Id,
} from "@conductor/backend";
import {
  FALLBACK_GIT_BASE_BRANCH,
  UI_TASK_DESCRIPTION_HINT,
} from "@conductor/shared";
import type { FunctionReturnType } from "convex/server";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { BranchSelect } from "@/lib/components/BranchSelect";
import {
  IconFileText,
  IconTrash,
  IconGitBranch,
  IconTag,
  IconCheck,
  IconX,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import {
  DescriptionMentionEditor,
  type DescriptionMentionEditorHandle,
} from "@/lib/components/tasks/_components/DescriptionMentionEditor";
import { tokenizedToEditable } from "@/lib/components/mentions";
import { PriorityPicker } from "@/lib/components/priority/PriorityPicker";
import type { Priority } from "@/lib/components/priority/priorityMeta";
import {
  ScreenshotsToggle,
  type ScreenshotsToggleValue,
} from "./ScreenshotsToggle";
import { AuditToggle, type AuditToggleValue } from "./AuditToggle";
import { NewProjectModal } from "@/lib/components/projects/NewProjectModal";
import { AssigneeSelector } from "./_components/AssigneeSelector";
import { ProjectPicker } from "./_components/ProjectPicker";
import { insertUiTaskDescriptionTemplate } from "@/lib/components/tasks/_utils/insertUiTaskDescription";

type User = FunctionReturnType<typeof api.users.listAll>[number];
type Project = FunctionReturnType<typeof api.projects.list>[number];
type QuickTaskDraft = FunctionReturnType<
  typeof api.agentTasks.listDrafts
>[number];

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: Id<"projects">;
  users?: User[];
  projects?: Project[];
  allTags?: string[];
  /** Pre-load this draft when the modal opens via a deep link. */
  initialDraft?: QuickTaskDraft;
}

export function QuickTaskModal({
  isOpen,
  onClose,
  projectId,
  users,
  projects,
  allTags,
  initialDraft,
}: QuickTaskModalProps) {
  const { repo } = useRepo();
  const defaultBranch = repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;
  const [title, setTitle] = useState(initialDraft?.title ?? "");
  const [description, setDescription] = useState(() =>
    initialDraft
      ? tokenizedToEditable(initialDraft.description ?? "").displayText
      : "",
  );
  const [baseBranch, setBaseBranch] = useState(
    initialDraft?.baseBranch ?? defaultBranch,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<Id<"agentTasks"> | null>(
    initialDraft?._id ?? null,
  );
  const [confirmDeleteId, setConfirmDeleteId] =
    useState<Id<"agentTasks"> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<
    Id<"projects"> | undefined
  >(initialDraft?.projectId ?? projectId);
  const [assignedTo, setAssignedTo] = useState<Id<"users"> | undefined>(
    undefined,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialDraft?.tags ?? [],
  );
  const [tagSearch, setTagSearch] = useState("");
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [screenshotsVideosEnabled, setScreenshotsVideosEnabled] =
    useState<ScreenshotsToggleValue>(undefined);
  const [runAuditEnabled, setRunAuditEnabled] =
    useState<AuditToggleValue>(undefined);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  const editorRef = useRef<DescriptionMentionEditorHandle>(null);

  // Seed the mention/skill maps from the initial draft's tokenized description
  // so that @-mention and /skill chips render correctly on deep-link open.
  const initialDescMaps = useMemo(
    () =>
      initialDraft
        ? tokenizedToEditable(initialDraft.description ?? "")
        : {
            mentionMap: new Map<string, string>(),
            skillMap: new Map<string, string>(),
          },
    // initialDraft is stable for the lifetime of this mount (key remount on change).
    // eslint-disable-next-line react/exhaustive-deps
    [],
  );

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const saveDraft = useMutation(api.agentTasks.saveDraft);
  const activateDraft = useMutation(api.agentTasks.activateDraft);
  const removeDraft = useMutation(api.agentTasks.remove);
  const drafts = useQuery(api.agentTasks.listDrafts, { repoId: repo._id });
  const defaultModel = normalizeAIModel(repo.defaultModel ?? DEFAULT_AI_MODEL);
  const [model, setModel] = useState<AIModel>(defaultModel);
  const [providerAccountId, setProviderAccountId] = useState<string | null>(
    null,
  );
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);
  const { options: accounts, resolveId: resolveAccountId } =
    useProviderAccounts();

  const effectiveProjectId = projectId ?? selectedProjectId;
  const effectiveProject = useQuery(
    api.projects.get,
    effectiveProjectId ? { id: effectiveProjectId } : "skip",
  );
  const branchLockedToProject = effectiveProjectId !== undefined;
  const displayBaseBranch = effectiveProject?.baseBranch ?? defaultBranch;

  const getDescription = () => {
    const tokenized = editorRef.current?.tokenize(description) ?? description;
    return tokenized.trim();
  };

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setBaseBranch(defaultBranch);
    setModel(defaultModel);
    setProviderAccountId(null);
    setActiveDraftId(null);
    setSelectedProjectId(projectId);
    setAssignedTo(undefined);
    setSelectedTags([]);
    setTagSearch("");
    setPriority(undefined);
    setScreenshotsVideosEnabled(undefined);
    setRunAuditEnabled(undefined);
  }, [defaultBranch, defaultModel, projectId]);

  const handleClose = useCallback(async () => {
    const desc = getDescription().trim();
    if (title.trim() || desc) {
      await saveDraft({
        id: activeDraftId ?? undefined,
        repoId: repo._id,
        title: title.trim() || undefined,
        description: desc || undefined,
        baseBranch: branchLockedToProject ? undefined : baseBranch,
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
    baseBranch,
    branchLockedToProject,
    selectedProjectId,
    resetForm,
    onClose,
  ]);

  const handleSubmit = async () => {
    if (!title.trim() || !displayBaseBranch || !repo) return;

    const desc = getDescription().trim();
    const taskBaseBranch = branchLockedToProject ? undefined : baseBranch;
    setIsLoading(true);
    try {
      if (activeDraftId) {
        await activateDraft({
          id: activeDraftId,
          title: title.trim(),
          description: desc || undefined,
          baseBranch: taskBaseBranch,
          model,
          providerAccountId: resolveAccountId(providerAccountId),
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          assignedTo,
          screenshotsVideosEnabled,
          runAuditEnabled,
        });
      } else {
        await createQuickTask({
          repoId: repo._id,
          title: title.trim(),
          description: desc || undefined,
          baseBranch: taskBaseBranch,
          model,
          providerAccountId: resolveAccountId(providerAccountId),
          projectId: selectedProjectId,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          assignedTo,
          priority,
          screenshotsVideosEnabled,
          runAuditEnabled,
        });
      }
      resetForm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDraft = (draft: QuickTaskDraft) => {
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

  const canSubmit = !isLoading && !!title.trim() && !!displayBaseBranch;

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
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent className="max-w-3xl gap-0 p-0" hideCloseButton>
          <div className="px-5 pt-5 pb-1">
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="border-0 shadow-none bg-transparent px-0 text-base font-medium focus-visible:ring-0 placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="scrollbar px-5 min-h-[160px] max-h-[50vh] overflow-y-auto">
            <DescriptionMentionEditor
              ref={editorRef}
              value={description}
              onValueChange={setDescription}
              placeholder={`Add description... @ for docs, / for skills. ${UI_TASK_DESCRIPTION_HINT}`}
              minHeight="min-h-[160px]"
              className="rounded-none border-0 px-0 py-2 shadow-none focus-visible:ring-0"
              initialMentionMap={initialDescMaps.mentionMap}
              initialSkillMap={initialDescMaps.skillMap}
            />
            <button
              type="button"
              className="hit-target inline-flex min-h-10 items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() =>
                setDescription(insertUiTaskDescriptionTemplate(description))
              }
            >
              Add UI details
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 px-5 py-3 bg-muted/30">
            <AssigneeSelector
              users={users}
              assignedTo={assignedTo}
              setAssignedTo={setAssignedTo}
            />

            <PriorityPicker value={priority} onChange={setPriority} />

            <ScreenshotsToggle
              value={screenshotsVideosEnabled}
              repoDefault={
                effectiveProject?.screenshotsVideosEnabled ??
                repo.screenshotsVideosEnabled ??
                false
              }
              onChange={setScreenshotsVideosEnabled}
            />

            <AuditToggle
              value={runAuditEnabled}
              inheritedDefault={
                effectiveProject?.runAuditEnabled ??
                effectiveProjectId !== undefined
              }
              onChange={setRunAuditEnabled}
            />

            <ProjectPicker
              projects={projects}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              open={projectPickerOpen}
              setOpen={setProjectPickerOpen}
              onCreateProject={() => setIsCreatingProject(true)}
            />

            {branchLockedToProject ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground"
                  >
                    <IconGitBranch size={14} />
                    <span className="text-foreground">{displayBaseBranch}</span>
                    <IconInfoCircle
                      size={12}
                      className="cursor-help text-muted-foreground"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Inherited from the project&apos;s base branch
                </TooltipContent>
              </Tooltip>
            ) : (
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
            )}

            <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
              <ModelSelect
                value={model}
                options={modelOptions}
                onValueChange={setModel}
                accounts={accounts}
                accountId={providerAccountId}
                onAccountChange={setProviderAccountId}
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
                          className="w-full px-2 py-1.5 text-sm text-left hover:bg-muted rounded-sm"
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
                          <IconTag
                            size={14}
                            className="text-muted-foreground"
                          />
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
                    <div className="scrollbar max-h-56 overflow-y-auto">
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
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors group cursor-pointer"
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
      <NewProjectModal
        isOpen={isCreatingProject}
        onClose={() => setIsCreatingProject(false)}
        onCreated={(id) => setSelectedProjectId(id)}
        defaultSkipPlanning
      />
    </>
  );
}
