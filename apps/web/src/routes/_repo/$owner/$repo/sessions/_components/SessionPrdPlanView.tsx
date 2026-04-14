"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import {
  Button,
  cn,
  Plan,
  PlanHeader,
  PlanTitle,
  PlanContent,
  PlanFooter,
  PlanTrigger,
  MessageResponse,
} from "@conductor/ui";
import { IconCode, IconPencil } from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { SessionPrdPlanEditor } from "./SessionPrdPlanEditor";

interface SessionPrdPlanViewProps {
  sessionId: Id<"sessions">;
  planContent: string;
  onApprovePlan: () => void;
  variant: "compact" | "panel";
  canEdit: boolean;
  isArchived?: boolean;
}

export function SessionPrdPlanView({
  sessionId,
  planContent,
  onApprovePlan,
  variant,
  canEdit,
  isArchived,
}: SessionPrdPlanViewProps) {
  const isPanel = variant === "panel";
  const updatePlanContent = useMutation(api.sessions.updatePlanContent);
  const [editingSnapshot, setEditingSnapshot] = useState<string | null>(null);
  const [editKey, setEditKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const showEdit = canEdit && !isArchived && editingSnapshot === null;

  const handleStartEdit = useCallback(() => {
    setEditingSnapshot(planContent);
    setEditKey((k) => k + 1);
  }, [planContent]);

  const handleCancelEdit = useCallback(() => {
    setEditingSnapshot(null);
  }, []);

  const handleSave = useCallback(
    async (markdown: string) => {
      setIsSaving(true);
      try {
        await updatePlanContent({
          id: sessionId,
          planContent: markdown,
        });
        setEditingSnapshot(null);
      } finally {
        setIsSaving(false);
      }
    },
    [sessionId, updatePlanContent],
  );

  return (
    <Plan
      defaultOpen
      className={cn(
        isPanel ? "flex min-h-0 flex-1 flex-col" : undefined,
        !isPanel && "mb-2",
      )}
    >
      <PlanHeader className={cn("p-4", isPanel && "shrink-0")}>
        <PlanTitle>Product Requirements</PlanTitle>
        <PlanTrigger />
      </PlanHeader>
      <PlanContent
        className={cn(
          "flex min-h-0 flex-col px-3 pb-3 pt-0 sm:px-4",
          isPanel
            ? "min-h-0 flex-1 overflow-hidden sm:pb-4"
            : "max-h-40 overflow-y-auto sm:max-h-64 sm:pb-4",
        )}
      >
        {editingSnapshot !== null ? (
          <SessionPrdPlanEditor
            key={editKey}
            initialMarkdown={editingSnapshot}
            onSave={handleSave}
            onCancel={handleCancelEdit}
            isSaving={isSaving}
          />
        ) : (
          <div
            className={cn(
              "overflow-y-auto",
              isPanel ? "min-h-0 flex-1" : "max-h-40 sm:max-h-64",
            )}
          >
            <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
              {planContent}
            </MessageResponse>
          </div>
        )}
      </PlanContent>
      <PlanFooter
        className={cn(
          "flex flex-wrap gap-2 px-4 pb-4 pt-0",
          isPanel && "shrink-0",
        )}
      >
        {showEdit ? (
          <Button
            size="sm"
            variant="secondary"
            className="motion-press"
            onClick={handleStartEdit}
          >
            <IconPencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        ) : null}
        {editingSnapshot === null ? (
          <Button
            size="sm"
            className="motion-press bg-success text-success-foreground hover:bg-success/90 hover:scale-[1.01] active:scale-[0.99]"
            onClick={onApprovePlan}
          >
            <IconCode className="w-3.5 h-3.5" />
            Approve Plan
          </Button>
        ) : null}
      </PlanFooter>
    </Plan>
  );
}
