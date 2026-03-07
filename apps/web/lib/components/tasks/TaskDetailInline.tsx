"use client";

import type { Id } from "@conductor/backend";
import { useTaskDetail } from "./useTaskDetail";

interface TaskDetailInlineProps {
  onClose: () => void;
  taskId: Id<"agentTasks">;
}

export function TaskDetailInline({ onClose, taskId }: TaskDetailInlineProps) {
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
    stopConfirmDialog,
    userMessageDialog,
    audit,
    showProofSection,
    requestChangesPanel,
  } = useTaskDetail(taskId, onClose);

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 md:px-6 md:pt-5">
          {titleContent}
        </div>
        <div className="px-3 sm:px-4 md:px-6 flex-1 overflow-hidden flex flex-col">
          {scheduledBadge}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-col md:grid md:grid-rows-1 md:grid-cols-[13fr_7fr] gap-3 sm:gap-4 md:gap-6 flex-1 min-h-0">
              <div className="space-y-4 md:space-y-6 min-h-0 overflow-y-auto scrollbar md:pr-4">
                {descriptionSection}
                {subtasksSection}
                {runsSection}
                {(audit || showProofSection) && (
                  <div className="space-y-4">{auditProofSection}</div>
                )}
                {requestChangesPanel && requestChangesSection}
              </div>
              <div className="md:pl-4 flex flex-col min-h-0 md:overflow-y-auto scrollbar">
                <div className="space-y-4 flex-1">{statusFieldsSection}</div>
                <div className="flex items-center justify-end pt-4 mt-4 pb-4 md:pb-0">
                  {footerButtons}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {deleteConfirmDialog}
      {stopConfirmDialog}
      {userMessageDialog}
    </>
  );
}
