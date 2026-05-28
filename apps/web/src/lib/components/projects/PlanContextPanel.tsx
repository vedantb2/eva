"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@conductor/ui";
import { parseSpec } from "@/lib/utils/parseSpec";
import { IconFileText, IconMessage } from "@tabler/icons-react";
import type { ConversationMessage } from "@/lib/components/projects/ProjectChatTab";
import { ProjectChatMessageList } from "./ProjectChatMessageList";

interface PlanContextPanelProps {
  generatedSpec: string;
  conversationHistory: ConversationMessage[];
}

export function PlanContextPanel({
  generatedSpec,
  conversationHistory,
}: PlanContextPanelProps) {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const parsedSpec = (() => {
    try {
      return parseSpec(generatedSpec);
    } catch {
      return null;
    }
  })();

  if (!parsedSpec) {
    return null;
  }

  return (
    <>
      <div className="flex justify-between gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => setShowPlanModal(true)}
        >
          <IconFileText size={14} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => setShowChatModal(true)}
        >
          <IconMessage size={14} />
        </Button>
      </div>

      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plan</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{parsedSpec.title}</h3>
                <p className="text-muted-foreground">
                  {parsedSpec.description}
                </p>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-medium">
                  Tasks ({parsedSpec.tasks.length})
                </h4>
                {parsedSpec.tasks.map((task, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-muted rounded"
                  >
                    <span className="text-muted-foreground font-mono">
                      {i + 1}.
                    </span>
                    <span>{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="pb-4">
            <DialogTitle>
              <div className="flex items-center gap-2">
                <IconMessage size={20} />
                Interview History
                <span className="text-sm font-normal text-muted-foreground">
                  ({conversationHistory.length} messages)
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-3 py-2">
              <ProjectChatMessageList messages={conversationHistory} />
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
