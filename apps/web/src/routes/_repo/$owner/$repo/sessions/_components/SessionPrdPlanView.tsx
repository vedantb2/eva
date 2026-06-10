"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import {
  Button,
  cn,
  Plan,
  PlanHeader,
  PlanTitle,
  PlanAction,
  PlanContent,
  PlanFooter,
  PlanTrigger,
  MessageResponse,
} from "@conductor/ui";
import {
  IconCheck,
  IconCode,
  IconCopy,
  IconPencil,
  IconX,
} from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import {
  SessionPrdPlanEditor,
  type SessionPrdPlanEditorHandle,
} from "./SessionPrdPlanEditor";

interface SessionPrdPlanViewProps {
  sessionId: Id<"sessions">;
  planContent: string;
  onApprovePlan: () => void;
  variant: "compact" | "panel";
  isArchived?: boolean;
}

export function SessionPrdPlanView({
  sessionId,
  planContent,
  onApprovePlan,
  variant,
  isArchived,
}: SessionPrdPlanViewProps) {
  const isPanel = variant === "panel";
  const updatePlanContent = useMutation(api.sessions.updatePlanContent);
  const [editingSnapshot, setEditingSnapshot] = useState<string | null>(null);
  const [editKey, setEditKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<SessionPrdPlanEditorHandle>(null);

  const showEdit = !isArchived && editingSnapshot === null;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(planContent);
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [planContent]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleStartEdit = useCallback(() => {
    setEditingSnapshot(planContent);
    setEditKey((k) => k + 1);
  }, [planContent]);

  const handleCancelEdit = useCallback(() => {
    setEditingSnapshot(null);
  }, []);

  const handleSave = useCallback(async () => {
    const markdown = editorRef.current?.getMarkdown();
    if (markdown === null || markdown === undefined) return;
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
  }, [sessionId, updatePlanContent]);

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
        <PlanAction>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy PRD"}
          >
            {copied ? (
              <IconCheck className="size-4 text-success" />
            ) : (
              <IconCopy className="size-4" />
            )}
          </Button>
          <PlanTrigger />
        </PlanAction>
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
            ref={editorRef}
            initialMarkdown={editingSnapshot}
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
        {editingSnapshot !== null ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="motion-press"
              disabled={isSaving}
              onClick={handleCancelEdit}
            >
              <IconX className="w-3.5 h-3.5" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="motion-press"
              disabled={isSaving}
              onClick={handleSave}
            >
              <IconCheck className="w-3.5 h-3.5" />
              Save
            </Button>
          </>
        ) : (
          <>
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
            <Button
              size="sm"
              className="motion-press bg-success text-success-foreground hover:bg-success/90 hover:scale-[1.01] active:scale-[0.96]"
              onClick={onApprovePlan}
            >
              <IconCode className="w-3.5 h-3.5" />
              Approve Plan
            </Button>
          </>
        )}
      </PlanFooter>
    </Plan>
  );
}
