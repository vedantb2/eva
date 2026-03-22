"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@conductor/ui";
import { IconLoader2 } from "@tabler/icons-react";

export function ResolveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isStarting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isStarting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Conflicts</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          This will start the agent to merge the latest base branch changes and
          resolve any conflicts. The task will remain in code review after
          completion.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            disabled={isStarting}
          >
            {isStarting && <IconLoader2 size={16} className="animate-spin" />}
            Resolve Conflicts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
