"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Spinner,
} from "@eva/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import {
  api,
  DEFAULT_AI_MODEL,
  normalizeAIModel,
  type AIModel,
  type Id,
} from "@eva/backend";
import { FALLBACK_GIT_BASE_BRANCH } from "@eva/shared";
import type { FunctionReturnType } from "convex/server";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { defaultProviderAccountId } from "@/lib/utils/defaultProviderAccount";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useGatewayDictation } from "@/lib/hooks/useGatewayDictation";
import {
  DescriptionMentionEditor,
  type DescriptionMentionEditorHandle,
} from "@/lib/components/tasks/_components/DescriptionMentionEditor";
import { attachPastedTextIfLarge } from "@/lib/components/attachments/attachmentMeta";
import { tokenizedToEditable } from "@/lib/components/mentions";
import type { Priority } from "@/lib/components/priority/priorityMeta";
import { NewProjectModal } from "@/lib/components/projects/NewProjectModal";
import { QuickTaskControlStrip } from "./_components/QuickTaskControlStrip";
import { QuickTaskDraftsMenu } from "./_components/QuickTaskDraftsMenu";
import { TaskFilesSection } from "./_components/TaskFilesSection";
import { useTaskAttachments } from "./useTaskAttachments";

type User = FunctionReturnType<typeof api.users.listAll>[number];
type Project = FunctionReturnType<typeof api.projects.list>[number];
type QuickTaskDraft = FunctionReturnType<
  typeof api.agentTasks.listDrafts
>[number];

/**
 * Convex treats an empty array and an absent field differently, so empty lists
 * are sent as undefined. Written as a helper rather than an inline ternary
 * because React Compiler bails on a whole file when a conditional expression
 * sits inside a try/catch, and one of the call sites has to run post-await.
 */
function undefinedIfEmpty<T>(items: T[]): T[] | undefined {
  return items.length > 0 ? items : undefined;
}

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
    useState(false);
  const [runAuditEnabled, setRunAuditEnabled] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  const editorRef = useRef<DescriptionMentionEditorHandle>(null);
  const voiceEnabled = useQuery(api.auth.getVoiceDictationEnabled);
  const { isListening, isConnecting, toggle } =
    useGatewayDictation(setDescription);

  // Seed the mention/skill maps from the initial draft's tokenized description
  // so that @-mention and /skill chips render correctly on deep-link open.
  const initialDescMaps = initialDraft
    ? tokenizedToEditable(initialDraft.description ?? "")
    : {
        mentionMap: new Map<string, string>(),
        skillMap: new Map<string, string>(),
      };

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const saveDraft = useMutation(api.agentTasks.saveDraft);
  const activateDraft = useMutation(api.agentTasks.activateDraft);
  const removeDraft = useMutation(api.agentTasks.remove);
  const drafts = useQuery(api.agentTasks.listDrafts, { repoId: repo._id });

  const attachments = useTaskAttachments();
  // Files already saved on the open draft, so reopening it keeps them.
  const draftAttachments = useQuery(
    api.agentTasks.listAttachments,
    activeDraftId ? { taskId: activeDraftId } : "skip",
  );
  const [hydratedDraftId, setHydratedDraftId] =
    useState<Id<"agentTasks"> | null>(null);
  if (activeDraftId && draftAttachments && hydratedDraftId !== activeDraftId) {
    setHydratedDraftId(activeDraftId);
    // An empty draft never clears files the user just attached.
    if (draftAttachments.length > 0) attachments.hydrate(draftAttachments);
  }

  const defaultModel = normalizeAIModel(repo.defaultModel ?? DEFAULT_AI_MODEL);
  const [model, setModel] = useState<AIModel>(defaultModel);
  const [providerAccountId, setProviderAccountId] = useState<string | null>(
    null,
  );
  const [accountDefaulted, setAccountDefaulted] = useState(false);
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);
  const {
    options: accounts,
    resolveId: resolveAccountId,
    ready: accountsReady,
  } = useProviderAccounts();

  // Once accounts load, default to the creator's personal account for the
  // selected model provider (Team when none match). Adjust during render.
  if (accountsReady && !accountDefaulted) {
    setProviderAccountId(defaultProviderAccountId(accounts, model));
    setAccountDefaulted(true);
  }

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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setBaseBranch(defaultBranch);
    setModel(defaultModel);
    setProviderAccountId(defaultProviderAccountId(accounts, defaultModel));
    setAccountDefaulted(accounts.length > 0);
    setActiveDraftId(null);
    setSelectedProjectId(projectId);
    setAssignedTo(undefined);
    setSelectedTags([]);
    setTagSearch("");
    setPriority(undefined);
    setScreenshotsVideosEnabled(false);
    setRunAuditEnabled(false);
    setHydratedDraftId(null);
    attachments.reset();
  };

  const handleClose = async () => {
    const desc = getDescription().trim();
    if (title.trim() || desc || attachments.attachments.length > 0) {
      const attachmentStorageIds = await attachments.upload();
      await saveDraft({
        id: activeDraftId ?? undefined,
        repoId: repo._id,
        title: title.trim() || undefined,
        description: desc || undefined,
        baseBranch: branchLockedToProject ? undefined : baseBranch,
        projectId: selectedProjectId,
        attachmentStorageIds:
          attachmentStorageIds.length > 0 ? attachmentStorageIds : undefined,
      });
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !displayBaseBranch || !repo) return;

    const desc = getDescription().trim();
    const taskBaseBranch = branchLockedToProject ? undefined : baseBranch;
    // Built before the try, and the post-await one via undefinedIfEmpty: React
    // Compiler bails on the whole file when a conditional, logical or
    // nullish-coalescing expression sits inside a try/catch.
    const taskDescription = desc || undefined;
    const taskAccountId = resolveAccountId(providerAccountId) ?? null;
    const taskTags = undefinedIfEmpty(selectedTags);
    setIsLoading(true);
    try {
      const attachmentStorageIds = await attachments.upload();
      const taskAttachmentIds = undefinedIfEmpty(attachmentStorageIds);
      if (activeDraftId) {
        await activateDraft({
          id: activeDraftId,
          title: title.trim(),
          description: taskDescription,
          baseBranch: taskBaseBranch,
          model,
          providerAccountId: taskAccountId,
          tags: taskTags,
          assignedTo,
          screenshotsVideosEnabled,
          runAuditEnabled,
          attachmentStorageIds: taskAttachmentIds,
        });
      } else {
        await createQuickTask({
          repoId: repo._id,
          title: title.trim(),
          description: taskDescription,
          baseBranch: taskBaseBranch,
          model,
          providerAccountId: taskAccountId,
          projectId: selectedProjectId,
          tags: taskTags,
          assignedTo,
          priority,
          screenshotsVideosEnabled,
          runAuditEnabled,
          attachmentStorageIds: taskAttachmentIds,
        });
      }
      resetForm();
      onClose();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
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
        {/* Composer dialog: the header is the title field, the body scrolls
            (description + attachments), and the control strip and footer stay
            pinned. `p-0` because each band owns its own edge padding and the
            dividers have to run the full width. */}
        <DialogContent className="max-w-3xl gap-0 p-0">
          <DialogHeader className="gap-0 px-4 pb-1 pt-4 text-left">
            <DialogTitle className="sr-only">New quick task</DialogTitle>
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="border-0 bg-transparent px-0 text-base font-medium shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
            />
          </DialogHeader>

          <DialogBody
            className="scrollbar mx-0 px-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const dropped = Array.from(e.dataTransfer.files);
              if (dropped.length === 0) return;
              e.preventDefault();
              attachments.add(dropped);
            }}
          >
            <div className="px-4">
              <DescriptionMentionEditor
                ref={editorRef}
                value={description}
                onValueChange={setDescription}
                placeholder="Add description…"
                minHeight="min-h-40"
                className="rounded-none border-0 px-0 py-2 shadow-none focus-visible:ring-0"
                initialMentionMap={initialDescMaps.mentionMap}
                initialSkillMap={initialDescMaps.skillMap}
                completionContext={`the description of a coding task for the repository ${repo.owner}/${repo.name}${title ? `, titled "${title}"` : ""}`}
                onImageFiles={attachments.add}
                onLargeTextPaste={(text) =>
                  attachPastedTextIfLarge(
                    text,
                    attachments.attachments.length,
                    attachments.add,
                  )
                }
              />
            </div>

            <TaskFilesSection
              attachments={attachments.attachments}
              onAdd={attachments.add}
              onRemove={attachments.remove}
              onReplace={attachments.replace}
              draftTaskId={activeDraftId}
            />
          </DialogBody>

          <QuickTaskControlStrip
            voiceEnabled={voiceEnabled}
            isListening={isListening}
            isConnecting={isConnecting}
            onToggleVoice={() => toggle(description)}
            isLoading={isLoading}
            priority={priority}
            onPriorityChange={setPriority}
            users={users}
            assignedTo={assignedTo}
            onAssigneeChange={setAssignedTo}
            model={model}
            modelOptions={modelOptions}
            accounts={accounts}
            providerAccountId={providerAccountId}
            onModelChange={(next) => {
              setModel(next);
              setProviderAccountId(defaultProviderAccountId(accounts, next));
            }}
            onProviderAccountChange={setProviderAccountId}
            branchLockedToProject={branchLockedToProject}
            displayBaseBranch={displayBaseBranch}
            baseBranch={baseBranch}
            onBaseBranchChange={setBaseBranch}
            screenshotsVideosEnabled={screenshotsVideosEnabled}
            onScreenshotsChange={setScreenshotsVideosEnabled}
            runAuditEnabled={runAuditEnabled}
            onRunAuditChange={setRunAuditEnabled}
            allTags={allTags ?? []}
            selectedTags={selectedTags}
            tagSearch={tagSearch}
            onTagSearchChange={setTagSearch}
            onToggleTag={toggleTag}
            onAddCustomTag={addCustomTag}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
            projectPickerOpen={projectPickerOpen}
            onProjectPickerOpenChange={setProjectPickerOpen}
            onCreateProject={() => setIsCreatingProject(true)}
          />

          <DialogFooter className="flex-col-reverse gap-2 border-t border-border px-4 py-2.5 sm:flex-row sm:justify-between">
            <div>
              {drafts && drafts.length > 0 && (
                <QuickTaskDraftsMenu
                  drafts={drafts}
                  onLoadDraft={loadDraft}
                  onDeleteDraft={handleDeleteDraft}
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
                {isLoading && <Spinner size="sm" />}
                Create Task
                <kbd className="ml-1.5 text-2xs opacity-60">⌘↵</kbd>
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
