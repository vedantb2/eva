"use client";

import type { Id } from "@conductor/backend";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@conductor/ui";
import {
  IconTerminal2,
  IconPhoto,
  IconShieldCheck,
  IconMessagePlus,
} from "@tabler/icons-react";
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
    proofSection,
    auditSection,
    commentsSection,
    statusFieldsSection,
    footerButtons,
    stopConfirmDialog,
    resolveConfirmDialog,
    userMessageDialog,
    activeTab,
    setActiveTab,
    isActivityBusy,
    isProofBusy,
    isAuditBusy,
  } = useTaskDetail(taskId, onClose, true);

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 md:px-6 md:pt-5">
          {titleContent}
        </div>
        <div className="px-3 sm:px-4 md:px-6 flex-1 min-h-0 overflow-y-auto scrollbar flex flex-col">
          {scheduledBadge}
          <div className="flex-1 flex flex-col">
            <div className="flex flex-col md:grid md:grid-rows-1 md:grid-cols-[14fr_6fr] gap-3 sm:gap-4 md:gap-6 flex-1 min-h-0">
              <div className="space-y-3 md:space-y-6 min-h-0 md:overflow-y-auto scrollbar md:pr-4">
                {descriptionSection}
                {subtasksSection}
                <Tabs
                  value={activeTab}
                  onValueChange={(v) =>
                    setActiveTab(
                      v as "activity" | "proof" | "audit" | "comments",
                    )
                  }
                >
                  <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger
                      value="activity"
                      className="gap-1 sm:gap-1.5 text-xs sm:text-sm"
                    >
                      <IconTerminal2 size={14} />
                      <span className="hidden sm:inline">Activity</span>
                      <span className="sm:hidden">Runs</span>
                      {isActivityBusy && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="proof"
                      className="gap-1 sm:gap-1.5 text-xs sm:text-sm"
                    >
                      <IconPhoto size={14} />
                      Proof
                      {isProofBusy && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="audit"
                      className="gap-1 sm:gap-1.5 text-xs sm:text-sm"
                    >
                      <IconShieldCheck size={14} />
                      Audit
                      {isAuditBusy && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className="gap-1 sm:gap-1.5 text-xs sm:text-sm"
                    >
                      <IconMessagePlus size={14} />
                      <span className="hidden sm:inline">Comments</span>
                      <span className="sm:hidden">Chat</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="activity" className="mt-3 sm:mt-4">
                    {runsSection}
                  </TabsContent>
                  <TabsContent value="proof" className="mt-3 sm:mt-4">
                    {proofSection}
                  </TabsContent>
                  <TabsContent value="audit" className="mt-3 sm:mt-4">
                    {auditSection}
                  </TabsContent>
                  <TabsContent value="comments" className="mt-3 sm:mt-4">
                    {commentsSection}
                  </TabsContent>
                </Tabs>
              </div>
              <div className="md:pl-4 flex flex-col min-h-0 md:overflow-y-auto scrollbar">
                <div className="space-y-3 md:space-y-4 flex-1">
                  {statusFieldsSection}
                </div>
                <div className="flex items-center justify-end pt-3 md:pt-4 mt-3 md:mt-4 pb-4 md:pb-0">
                  {footerButtons}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {stopConfirmDialog}
      {resolveConfirmDialog}
      {userMessageDialog}
    </>
  );
}
