"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useNavigate } from "@tanstack/react-router";
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import {
  IconCheck,
  IconCode,
  IconCopy,
  IconFileExport,
  IconPencil,
} from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { MarkdownEditor } from "@/lib/components/editor/MarkdownEditor";
import { useRepo } from "@/lib/contexts/RepoContext";
import { DOC_VIEWER_DEFAULT_TAB } from "@/lib/search-params";

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
  const { basePath } = useRepo();
  const navigate = useNavigate();
  const updatePlanContent = useMutation(api.sessions.updatePlanContent);
  const createDocFromSession = useMutation(api.docs.createFromSession);
  const linkedDoc = useQuery(api.docs.getBySession, { sessionId });
  const [editingSnapshot, setEditingSnapshot] = useState<string | null>(null);
  const [editKey, setEditKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleSaveAsDocument = useCallback(async () => {
    if (!planContent.trim()) return;
    setIsSavingDoc(true);
    try {
      const docId = await createDocFromSession({ sessionId });
      navigate({ to: `${basePath}/docs/${docId}/${DOC_VIEWER_DEFAULT_TAB}` });
    } finally {
      setIsSavingDoc(false);
    }
  }, [basePath, createDocFromSession, navigate, planContent, sessionId]);

  const hasContent = planContent.trim().length > 0;
  const docButtonLabel = linkedDoc ? "Update Document" : "Save as Document";

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
          <MarkdownEditor
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
        {editingSnapshot === null && !isArchived ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={!hasContent ? "cursor-not-allowed" : undefined}>
                <Button
                  size="sm"
                  variant="secondary"
                  className="motion-press"
                  onClick={handleSaveAsDocument}
                  disabled={!hasContent || isSavingDoc}
                >
                  <IconFileExport className="w-3.5 h-3.5" />
                  {docButtonLabel}
                </Button>
              </span>
            </TooltipTrigger>
            {!hasContent ? (
              <TooltipContent>
                Add plan content before saving as a document
              </TooltipContent>
            ) : null}
          </Tooltip>
        ) : null}
        {editingSnapshot === null ? (
          <Button
            size="sm"
            className="motion-press bg-success text-success-foreground hover:bg-success/90 hover:scale-[1.01] active:scale-[0.96]"
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
