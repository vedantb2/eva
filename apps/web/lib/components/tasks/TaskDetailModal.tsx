"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@conductor/ui";
import {
  IconTerminal2,
  IconPhoto,
  IconShieldCheck,
  IconMessagePlus,
} from "@tabler/icons-react";
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
    showTabsColumn,
    layoutGridClass,
    modalWidthClass,
    isActivityBusy,
    isProofBusy,
    isAuditBusy,
  } = useTaskDetail(taskId, onClose);

  const gridClass = showTabsColumn
    ? layoutGridClass
    : "grid-cols-1 md:grid-cols-[1fr_200px]";

  const widthClass = showTabsColumn
    ? modalWidthClass
    : "max-w-[calc(100vw-2rem)] md:max-w-[48rem]";

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <DialogContent
          className={`w-full ${widthClass} max-h-[90vh] h-[90vh] md:h-auto overflow-hidden flex flex-col p-4 sm:p-6`}
        >
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {titleContent}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {scheduledBadge}
            <div className="flex-1 min-h-0 pb-2 md:pb-6 flex flex-col overflow-hidden">
              <div
                className={`grid gap-3 md:gap-6 flex-1 min-h-0 overflow-y-auto md:overflow-hidden md:grid-rows-1 ${gridClass}`}
              >
                <div className="space-y-3 md:space-y-6 min-h-0 md:overflow-y-auto scrollbar md:pr-2">
                  {descriptionSection}
                  {subtasksSection}
                </div>
                {showTabsColumn && (
                  <div className="md:pl-4 min-h-0 md:overflow-y-auto scrollbar">
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) =>
                        setActiveTab(
                          v as "activity" | "proof" | "audit" | "comments",
                        )
                      }
                    >
                      <TabsList className="w-full justify-start overflow-x-auto sticky top-0 z-10 bg-background">
                        <TabsTrigger
                          value="activity"
                          className="gap-1 sm:gap-1.5 text-xs sm:text-sm min-h-[36px]"
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
                          className="gap-1 sm:gap-1.5 text-xs sm:text-sm min-h-[36px]"
                        >
                          <IconPhoto size={14} />
                          Proof
                          {isProofBusy && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="audit"
                          className="gap-1 sm:gap-1.5 text-xs sm:text-sm min-h-[36px]"
                        >
                          <IconShieldCheck size={14} />
                          Audit
                          {isAuditBusy && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="comments"
                          className="gap-1 sm:gap-1.5 text-xs sm:text-sm min-h-[36px]"
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
                )}
                <div className="md:pl-4 space-y-3 md:space-y-4 min-h-0 md:overflow-y-auto scrollbar">
                  {statusFieldsSection}
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end border-t border-border pt-3 md:pt-4 gap-1.5">
            {footerButtons}
          </div>
        </DialogContent>
      </Dialog>
      {stopConfirmDialog}
      {resolveConfirmDialog}
      {userMessageDialog}
    </>
  );
}
