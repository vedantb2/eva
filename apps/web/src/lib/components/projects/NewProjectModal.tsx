"use client";

import { useState, useRef, lazy, Suspense } from "react";
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
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import { BranchSelect } from "@/lib/components/BranchSelect";
import {
  IconGitBranch,
  IconListCheck,
  IconSparkles,
  IconCheck,
} from "@tabler/icons-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { MarkdownEditorHandle } from "@/lib/components/tasks/_components/MarkdownEditor";
import { PriorityPicker } from "@/lib/components/priority/PriorityPicker";
import type { Priority } from "@/lib/components/priority/priorityMeta";

const MarkdownEditor = lazy(() =>
  import("@/lib/components/tasks/_components/MarkdownEditor").then((m) => ({
    default: m.MarkdownEditor,
  })),
);

function getSubmitDisabledReason(
  isLoading: boolean,
  title: string,
  description: string,
): string | undefined {
  if (isLoading) return "Creating project…";
  const missingTitle = !title.trim();
  const missingDescription = !description.trim();
  if (missingTitle && missingDescription) {
    return "Enter a project title and description";
  }
  if (missingTitle) return "Enter a project title";
  if (missingDescription) return "Enter a description";
  return undefined;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When provided, called with the new project id and auto-navigation is skipped. */
  onCreated?: (projectId: Id<"projects">) => void;
  /** Default value of the planning-mode picker. Defaults to false (interview/plan flow). */
  defaultSkipPlanning?: boolean;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreated,
  defaultSkipPlanning = false,
}: NewProjectModalProps) {
  const { repo, basePath } = useRepo();
  const navigate = useNavigate();
  const defaultBranch = repo?.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baseBranch, setBaseBranch] = useState(defaultBranch);
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [skipPlanning, setSkipPlanning] = useState(defaultSkipPlanning);
  const [planningPickerOpen, setPlanningPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const editorRef = useRef<MarkdownEditorHandle>(null);

  const createProject = useMutation(api.projects.create);

  const getDescription = () => editorRef.current?.getMarkdown() ?? description;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setBaseBranch(defaultBranch);
    setPriority(undefined);
    setSkipPlanning(defaultSkipPlanning);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canSubmit = !isLoading && !!title.trim() && !!description.trim();
  const submitDisabledReason = getSubmitDisabledReason(
    isLoading,
    title,
    description,
  );

  const handleSubmit = async () => {
    const desc = getDescription().trim();
    if (!title.trim() || !desc || !repo) return;

    setIsLoading(true);
    try {
      const projectId = await createProject({
        repoId: repo._id,
        title: title.trim(),
        rawInput: desc,
        baseBranch,
        priority,
        skipPlanning,
      });

      resetForm();
      onClose();
      if (onCreated) {
        onCreated(projectId);
      } else {
        navigate({ to: basePath + "/projects/" + projectId });
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            placeholder="Project title"
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
              onChange={setDescription}
              editable
              placeholder="Describe what you want to build..."
              minHeight="min-h-[160px]"
              className="text-sm [&_.tiptap]:px-0 [&_.tiptap]:py-2"
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

          <PriorityPicker value={priority} onChange={setPriority} />

          <Popover
            open={planningPickerOpen}
            onOpenChange={setPlanningPickerOpen}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                {skipPlanning ? (
                  <IconListCheck size={14} />
                ) : (
                  <IconSparkles size={14} />
                )}
                <span className="text-foreground">
                  {skipPlanning ? "Tasks only" : "With interview/plan"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-0">
              <Command>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSkipPlanning(false);
                        setPlanningPickerOpen(false);
                      }}
                    >
                      <IconSparkles size={14} className="mr-2" />
                      <div className="flex-1">
                        <div className="text-sm">With interview/plan</div>
                        <div className="text-xs text-muted-foreground">
                          AI interview, then generated spec
                        </div>
                      </div>
                      {!skipPlanning && (
                        <IconCheck size={14} className="ml-2" />
                      )}
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        setSkipPlanning(true);
                        setPlanningPickerOpen(false);
                      }}
                    >
                      <IconListCheck size={14} className="mr-2" />
                      <div className="flex-1">
                        <div className="text-sm">Tasks only</div>
                        <div className="text-xs text-muted-foreground">
                          Skip planning, just a task container
                        </div>
                      </div>
                      {skipPlanning && <IconCheck size={14} className="ml-2" />}
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 px-5 py-3 sm:flex-row sm:justify-end bg-muted/15">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button onClick={handleSubmit} disabled={!canSubmit}>
                  {isLoading && <Spinner size="sm" />}
                  Create Project
                  <kbd className="ml-1.5 text-xs opacity-60">⌘↵</kbd>
                </Button>
              </span>
            </TooltipTrigger>
            {submitDisabledReason !== undefined && (
              <TooltipContent>{submitDisabledReason}</TooltipContent>
            )}
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
