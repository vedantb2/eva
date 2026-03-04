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
    audit,
    showProofSection,
    requestChangesPanel,
  } = useTaskDetail(taskId, onClose);

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-4 pt-4 pb-2">{titleContent}</div>
        <div className="px-4 flex-1 overflow-hidden flex flex-col">
          {scheduledBadge}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-[3fr_2fr] gap-6 h-full">
              <div className="space-y-6 overflow-y-auto scrollbar pr-4">
                {descriptionSection}
                {subtasksSection}
                {runsSection}
                {(audit || showProofSection) && (
                  <div className="space-y-4">{auditProofSection}</div>
                )}
                {requestChangesPanel && requestChangesSection}
              </div>
              <div className=" pl-4 flex flex-col overflow-y-auto scrollbar">
                <div className="space-y-4 flex-1">{statusFieldsSection}</div>
                <div className="flex items-center justify-between pt-4 mt-4 ">
                  {footerButtons}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {deleteConfirmDialog}
    </>
  );
}
