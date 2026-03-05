"use client";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@conductor/ui";
import type { Id } from "@conductor/backend";
import { useTaskDetail } from "./useTaskDetail";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: Id<"agentTasks">;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  taskId,
}: TaskDetailModalProps) {
  const {
    titleContent,
    scheduledBadge,
    descriptionSection,
    subtasksSection,
    runsSection,
    auditProofSection,
    statusFieldsSection,
    requestChangesSection,
    footerButtons,
    deleteConfirmDialog,
    audit,
    showProofSection,
    requestChangesPanel,
    layoutGridClass,
    modalWidthClass,
  } = useTaskDetail(taskId, onClose);

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <DialogContent className={modalWidthClass}>
          <DialogHeader>
            <DialogTitle>{titleContent}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {scheduledBadge}
            <div className="pb-6">
              <div className={`grid gap-6 min-h-[400px] ${layoutGridClass}`}>
                <div className="space-y-6 overflow-y-auto scrollbar pr-2">
                  {descriptionSection}
                  {subtasksSection}
                  {runsSection}
                </div>
                {(audit || showProofSection) && (
                  <div className="pl-4 space-y-4 overflow-y-auto scrollbar">
                    {auditProofSection}
                  </div>
                )}
                <div className="pl-4 space-y-4">{statusFieldsSection}</div>
                {requestChangesPanel && (
                  <div className="flex flex-col border-l border-border pl-6">
                    {requestChangesSection}
                  </div>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="sm:justify-between">
            {footerButtons}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {deleteConfirmDialog}
    </>
  );
}
