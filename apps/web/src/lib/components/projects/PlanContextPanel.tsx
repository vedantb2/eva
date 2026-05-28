"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";
import { parseSpec } from "@/lib/utils/parseSpec";
import { IconFileText, IconMessage, IconDots } from "@tabler/icons-react";
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="rounded-full">
            <IconDots size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowPlanModal(true)}>
            <IconFileText className="mr-2 h-4 w-4" />
            View plan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowChatModal(true)}>
            <IconMessage className="mr-2 h-4 w-4" />
            View interview history
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
