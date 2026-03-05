"use client";

import {
  Dialog,
  DialogContent,
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
        <DialogContent
          className={`${modalWidthClass} max-h-[90vh] overflow-hidden flex flex-col`}
        >
          <DialogHeader>
            <DialogTitle>{titleContent}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
            {scheduledBadge}
            <div className="pb-4">
              <div className={`grid gap-4 md:gap-6 ${layoutGridClass}`}>
                <div className="space-y-4 md:space-y-6">
                  {descriptionSection}
                  {subtasksSection}
                  {runsSection}
                </div>
                {(audit || showProofSection) && (
                  <div className="md:pl-4 space-y-4">{auditProofSection}</div>
                )}
                <div className="md:pl-4 space-y-4">{statusFieldsSection}</div>
                {requestChangesPanel && (
                  <div className="flex flex-col md:border-l border-border md:pl-6">
                    {requestChangesSection}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between pt-2 border-t border-border/50">
            {footerButtons}
          </div>
        </DialogContent>
      </Dialog>
      {deleteConfirmDialog}
    </>
  );
}
