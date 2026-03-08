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
    deleteConfirmDialog,
    stopConfirmDialog,
    userMessageDialog,
    activeTab,
    setActiveTab,
    showTabsColumn,
    layoutGridClass,
    modalWidthClass,
  } = useTaskDetail(taskId, onClose);

  const gridClass = showTabsColumn
    ? layoutGridClass
    : "grid-cols-1 md:grid-cols-[1fr_200px]";

  const widthClass = showTabsColumn ? modalWidthClass : "max-w-[48rem]";

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <DialogContent
          className={`w-full ${widthClass} max-h-[90vh] overflow-hidden flex flex-col`}
        >
          <DialogHeader>
            <DialogTitle>{titleContent}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col">
            {scheduledBadge}
            <div className="flex-1 min-h-0 pb-6 flex flex-col">
              <div
                className={`grid grid-rows-1 gap-4 md:gap-6 flex-1 min-h-0 ${gridClass}`}
              >
                <div className="space-y-4 md:space-y-6 min-h-0 overflow-y-auto scrollbar md:pr-2">
                  {descriptionSection}
                  {subtasksSection}
                </div>
                {showTabsColumn && (
                  <div className="md:pl-4 min-h-0 overflow-y-auto scrollbar">
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) =>
                        setActiveTab(
                          v as "activity" | "proof" | "audit" | "comments",
                        )
                      }
                    >
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="activity">
                          <IconTerminal2 size={14} />
                          Activity
                        </TabsTrigger>
                        <TabsTrigger value="proof">
                          <IconPhoto size={14} />
                          Proof
                        </TabsTrigger>
                        <TabsTrigger value="audit">
                          <IconShieldCheck size={14} />
                          Audit
                        </TabsTrigger>
                        <TabsTrigger value="comments">
                          <IconMessagePlus size={14} />
                          Comments
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="activity" className="mt-4">
                        {runsSection}
                      </TabsContent>
                      <TabsContent value="proof" className="mt-4">
                        {proofSection}
                      </TabsContent>
                      <TabsContent value="audit" className="mt-4">
                        {auditSection}
                      </TabsContent>
                      <TabsContent value="comments" className="mt-4">
                        {commentsSection}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
                <div className="md:pl-4 space-y-4 min-h-0 overflow-y-auto scrollbar">
                  {statusFieldsSection}
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end border-t border-border pt-4">
            {footerButtons}
          </div>
        </DialogContent>
      </Dialog>
      {deleteConfirmDialog}
      {stopConfirmDialog}
      {userMessageDialog}
    </>
  );
}
