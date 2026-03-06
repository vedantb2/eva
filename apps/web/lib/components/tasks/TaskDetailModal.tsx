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
          <div className="flex-1 min-h-0 flex flex-col">
            {scheduledBadge}
            <div className="flex-1 min-h-0 pb-6 flex flex-col">
              <div
                className={`grid grid-rows-1 gap-4 md:gap-6 flex-1 min-h-0 ${layoutGridClass}`}
              >
                <div className="space-y-4 md:space-y-6 min-h-0 overflow-y-auto scrollbar md:pr-2">
                  {descriptionSection}
                  {subtasksSection}
                  {runsSection}
                </div>
                {(audit || showProofSection) && (
                  <div className="md:pl-4 space-y-4 min-h-0 overflow-y-auto scrollbar">
                    {auditProofSection}
                  </div>
                )}
                <div className="md:pl-4 space-y-4 min-h-0 overflow-y-auto scrollbar">
                  {statusFieldsSection}
                </div>
                {requestChangesPanel && (
                  <div className="flex flex-col md:border-l border-border md:pl-6 min-h-0 overflow-y-auto scrollbar">
                    {requestChangesSection}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end border-t border-border pt-4">
            {footerButtons}
          </div>
        </DialogContent>
      </Dialog>
      {deleteConfirmDialog}
    </>
  );
}
