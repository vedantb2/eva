"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  motionBase,
  motionSlow,
  motionSpring,
  Spinner,
} from "@eva/ui";
import { IconCircleCheck } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction, useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { m, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const REVIEW_AUDITS = [
  "Running code audits",
  "Analyzing results",
  "Generating report",
];

interface SessionReviewModalProps {
  sessionId: Id<"sessions">;
  open: boolean;
  onClose: () => void;
}

export function SessionReviewModal({
  sessionId,
  open,
  onClose,
}: SessionReviewModalProps) {
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [reviewStep, setReviewStep] = useState<
    "confirm" | "auditing" | "complete"
  >("confirm");
  const [completedAudits, setCompletedAudits] = useState(0);

  const createPr = useAction(api.github.createSessionPr);
  const startAuditMutation = useMutation(api.audits.startSessionAudit);
  const sessionAudit = useQuery(
    api.audits.getBySession,
    reviewStep === "auditing" ? { sessionId } : "skip",
  );

  const resetState = () => {
    setReviewStep("confirm");
    setCompletedAudits(0);
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  const handleCreatePr = async () => {
    setReviewStep("auditing");
    setCompletedAudits(0);
    setIsCreatingPr(true);
    try {
      await createPr({ sessionId });
      try {
        await startAuditMutation({ sessionId });
      } catch {
        setReviewStep("complete");
      }
    } catch {
      setReviewStep("confirm");
    }
    setIsCreatingPr(false);
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reviewStep === "auditing") {
      const status = sessionAudit?.status;
      if (status === "completed" || status === "error") {
        for (let index = 0; index < REVIEW_AUDITS.length; index++) {
          timers.push(
            setTimeout(
              () => setCompletedAudits((prev) => prev + 1),
              (index + 1) * 400,
            ),
          );
        }
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [sessionAudit?.status, reviewStep]);

  useEffect(() => {
    if (reviewStep !== "auditing" || completedAudits < REVIEW_AUDITS.length) {
      return;
    }
    const timer = setTimeout(() => setReviewStep("complete"), 300);
    return () => clearTimeout(timer);
  }, [reviewStep, completedAudits]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
    >
      <DialogContent>
        <AnimatePresence initial={false} mode="wait">
          {reviewStep === "confirm" && (
            <m.div
              key="confirm"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={motionBase}
            >
              <DialogHeader>
                <DialogTitle>Send for Code Review</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground">
                Marks your PR ready for review. The session stays open, and an
                automated code audit runs in the background.
              </p>
              <DialogFooter>
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  className="bg-status-code-review text-white hover:bg-status-code-review/90"
                  onClick={handleCreatePr}
                  disabled={isCreatingPr}
                >
                  {isCreatingPr ? <Spinner size="sm" /> : "Confirm"}
                </Button>
              </DialogFooter>
            </m.div>
          )}
          {reviewStep === "auditing" && (
            <m.div
              key="auditing"
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={motionBase}
            >
              <DialogHeader>
                <DialogTitle>Auditing in Progress</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {REVIEW_AUDITS.map((audit, index) => {
                  const isComplete = index < completedAudits;
                  const isActive =
                    index === completedAudits &&
                    completedAudits < REVIEW_AUDITS.length;
                  return (
                    <m.div
                      key={audit}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...motionBase, delay: index * 0.1 }}
                    >
                      <div className="flex h-5 w-5 items-center justify-center">
                        {isComplete ? (
                          <m.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={motionSpring}
                          >
                            <IconCircleCheck
                              size={20}
                              className="text-success"
                            />
                          </m.div>
                        ) : isActive ? (
                          <Spinner size="sm" />
                        ) : (
                          <div className="h-4 w-4 rounded-full ring-2 ring-muted" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${isComplete || isActive ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {audit}
                      </span>
                    </m.div>
                  );
                })}
              </div>
            </m.div>
          )}
          {reviewStep === "complete" && (
            <m.div
              key="complete"
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={motionSlow}
            >
              <DialogHeader>
                <DialogTitle>Review Sent</DialogTitle>
              </DialogHeader>
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...motionSlow, delay: 0.1 }}
                className="rounded-surface bg-status-code-review-bg p-4 text-center"
              >
                <IconCircleCheck
                  size={24}
                  className="mx-auto mb-2 text-status-code-review"
                />
                <p className="text-sm font-medium text-status-code-review">
                  Sent to the team for review.
                </p>
              </m.div>
              <DialogFooter>
                <Button onClick={handleClose}>Done</Button>
              </DialogFooter>
            </m.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
