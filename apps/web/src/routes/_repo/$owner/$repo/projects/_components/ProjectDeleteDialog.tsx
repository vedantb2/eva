import type { Id } from "@conductor/backend";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@conductor/ui";

interface ProjectDeleteDialogProps {
  project: { id: Id<"projects">; title: string } | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function ProjectDeleteDialog({
  project,
  onClose,
  onConfirm,
  isDeleting,
}: ProjectDeleteDialogProps) {
  return (
    <Dialog
      open={project !== null}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
        </DialogHeader>
        <div>
          <p className="text-muted-foreground">
            Are you sure you want to delete <strong>{project?.title}</strong>?
          </p>
          <div className="mt-3 p-3 bg-warning-bg rounded-lg">
            <p className="text-sm text-warning">
              This will permanently delete the project and all associated tasks,
              subtasks, agent runs, and dependencies.
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
