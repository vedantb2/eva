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
    deleteConfirmDialog,
    stopConfirmDialog,
    userMessageDialog,
    activeTab,
    setActiveTab,
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
                <Tabs
                  value={activeTab}
                  onValueChange={(v) =>
                    setActiveTab(
                      v as "activity" | "proof" | "audit" | "comments",
                    )
                  }
                >
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="activity" className="gap-1.5">
                      <IconTerminal2 size={14} />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="proof" className="gap-1.5">
                      <IconPhoto size={14} />
                      Proof
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="gap-1.5">
                      <IconShieldCheck size={14} />
                      Audit
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="gap-1.5">
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
