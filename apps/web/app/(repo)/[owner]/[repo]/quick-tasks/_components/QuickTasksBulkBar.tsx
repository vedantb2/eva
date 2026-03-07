"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@conductor/ui";
import {
  IconBolt,
  IconFolders,
  IconTrash,
  IconTags,
  IconUser,
  IconUserCheck,
  IconRefresh,
  IconPlayerPlay,
  IconCalendarClock,
} from "@tabler/icons-react";

export type BulkAction =
  | "actions"
  | "group"
  | "delete"
  | "addLabels"
  | "assign"
  | "assignMe"
  | "changeStatus"
  | "run"
  | "schedule";

interface QuickTasksBulkBarProps {
  isSelecting: boolean;
  selectedCount: number;
  onExitSelect: () => void;
  activeBulkAction: BulkAction | null;
  onSetBulkAction: (action: BulkAction | null) => void;
}

export function QuickTasksBulkBar({
  isSelecting,
  selectedCount,
  onExitSelect,
  activeBulkAction,
  onSetBulkAction,
}: QuickTasksBulkBarProps) {
  return (
    <>
      <AnimatePresence initial={false}>
        {isSelecting && (
          <motion.div
            key="quick-tasks-actions-bottom"
            className="absolute inset-x-2 bottom-2 z-20 flex justify-center pb-[env(safe-area-inset-bottom)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-sm">
              <Button
                size="sm"
                variant="secondary"
                className="motion-press hover:scale-[1.01] active:scale-[0.99]"
                onClick={onExitSelect}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="motion-press min-w-28 hover:scale-[1.01] active:scale-[0.99] sm:min-w-36"
                onClick={() => onSetBulkAction("actions")}
                disabled={selectedCount === 0}
              >
                <IconBolt size={16} />
                Actions
                {selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Dialog
        open={activeBulkAction === "actions"}
        onOpenChange={(v) => {
          if (!v) onSetBulkAction(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Selected task actions</DialogTitle>
            <DialogDescription>
              {selectedCount} task{selectedCount === 1 ? "" : "s"} selected
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => onSetBulkAction("group")}
              disabled={selectedCount === 0}
            >
              <IconFolders size={16} />
              Group into Project
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => onSetBulkAction("addLabels")}
              disabled={selectedCount === 0}
            >
              <IconTags size={16} />
              Add Labels
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => onSetBulkAction("assign")}
              disabled={selectedCount === 0}
            >
              <IconUser size={16} />
              Assign to...
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => onSetBulkAction("assignMe")}
              disabled={selectedCount === 0}
            >
              <IconUserCheck size={16} />
              Assign to Me
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => onSetBulkAction("changeStatus")}
              disabled={selectedCount === 0}
            >
              <IconRefresh size={16} />
              Change Status
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => onSetBulkAction("schedule")}
              disabled={selectedCount === 0}
            >
              <IconCalendarClock size={16} />
              Schedule Run
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => onSetBulkAction("run")}
              disabled={selectedCount === 0}
            >
              <IconPlayerPlay size={16} />
              Run Tasks
            </Button>
            <Button
              variant="destructive"
              className="justify-start"
              onClick={() => onSetBulkAction("delete")}
              disabled={selectedCount === 0}
            >
              <IconTrash size={16} />
              Delete All
            </Button>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => onSetBulkAction(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
