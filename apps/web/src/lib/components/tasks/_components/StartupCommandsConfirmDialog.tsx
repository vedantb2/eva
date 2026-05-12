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

export function StartupCommandsConfirmDialog({
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
          <DialogTitle>Run Startup Commands</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          This will re-run the configured startup commands in the sandbox. Any
          running dev services will be restarted.
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
            Run Startup Commands
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
