"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from "@conductor/ui";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useMutation } from "convex/react";
import { useState } from "react";

interface SessionSummaryModalProps {
  sessionId: Id<"sessions">;
  hasSummary: boolean;
  open: boolean;
  onClose: () => void;
}

export function SessionSummaryModal({
  sessionId,
  hasSummary,
  open,
  onClose,
}: SessionSummaryModalProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const startSummarize = useMutation(api.summarizeWorkflow.startSummarize);

  const handleConfirm = async () => {
    setIsSummarizing(true);
    try {
      await startSummarize({ sessionId });
      onClose();
    } catch (error) {
      setIsSummarizing(false);
      throw error;
    }
    setIsSummarizing(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {hasSummary ? "Regenerate Summary" : "Generate Summary"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            {hasSummary
              ? "This will regenerate and replace the current session summary."
              : "This will generate a session summary from the current chat history."}
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSummarizing}>
            {isSummarizing ? <Spinner size="sm" /> : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
