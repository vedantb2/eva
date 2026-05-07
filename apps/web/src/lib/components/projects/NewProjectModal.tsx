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
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { IconGitBranch } from "@tabler/icons-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { MarkdownEditorHandle } from "@/lib/components/tasks/_components/MarkdownEditor";
import { PriorityPicker } from "@/lib/components/priority/PriorityPicker";
import type { Priority } from "@/lib/components/priority/priorityMeta";

const MarkdownEditor = lazy(() =>
  import("@/lib/components/tasks/_components/MarkdownEditor").then((m) => ({
    default: m.MarkdownEditor,
  })),
);

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const { repo, basePath } = useRepo();
  const navigate = useNavigate();
  const defaultBranch = repo?.defaultBaseBranch ?? "main";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baseBranch, setBaseBranch] = useState(defaultBranch);
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const editorRef = useRef<MarkdownEditorHandle>(null);

  const createProject = useMutation(api.projects.create);

  const getDescription = () => editorRef.current?.getMarkdown() ?? description;

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setBaseBranch(defaultBranch);
    setPriority(undefined);
  }, [defaultBranch]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const canSubmit = !isLoading && !!title.trim() && !!getDescription().trim();

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
      });

      resetForm();
      onClose();
      navigate({ to: basePath + "/projects/" + projectId });
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
              editable
              placeholder="Describe what you want to build..."
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
        </div>

        <DialogFooter className="flex-col-reverse gap-2 px-5 py-3 sm:flex-row sm:justify-end bg-muted/15">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isLoading && <Spinner size="sm" />}
            Create Project
            <kbd className="ml-1.5 text-xs opacity-60">⌘↵</kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
