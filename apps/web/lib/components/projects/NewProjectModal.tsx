"use client";

import { useState } from "react";
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
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useRouter } from "next/navigation";

import { BranchSelect } from "@/lib/components/BranchSelect";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const { repo, basePath } = useRepo();
  const router = useRouter();
  const defaultBranch = repo?.defaultBaseBranch ?? "main";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baseBranch, setBaseBranch] = useState(defaultBranch);
  const [isLoading, setIsLoading] = useState(false);

  const createProject = useMutation(api.projects.create);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !repo) return;

    setIsLoading(true);
    try {
      const projectId = await createProject({
        repoId: repo._id,
        title: title.trim(),
        rawInput: description.trim(),
        baseBranch,
      });

      setTitle("");
      setDescription("");
      setBaseBranch(defaultBranch);
      onClose();
      router.push(basePath + "/projects/" + projectId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            placeholder="Describe what you want to build..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <BranchSelect value={baseBranch} onValueChange={setBaseBranch} />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !description.trim()}
          >
            {isLoading && <Spinner size="sm" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
