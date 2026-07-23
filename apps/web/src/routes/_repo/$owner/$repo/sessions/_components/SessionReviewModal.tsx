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
import { IconCircleCheck } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { AnimatePresence, motion } from "motion/react";
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
            <motion.div
              key="confirm"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle>Send for Code Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  By clicking this you confirm that all your changes have been
                  tested in your session, you are happy with those changes, have
                  generated a summary, and agree with the changes. Your session
                  will become uneditable while a developer reviews the code
                  changes before merging into staging/production.
                </p>
                <p>
                  The following audits will also run automatically in the
                  background:
                </p>
                <p>
                  An automated code audit will run to check accessibility,
                  testing, code quality, and other configured checks.
                </p>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={handleCreatePr}
                  disabled={isCreatingPr}
                >
                  {isCreatingPr ? <Spinner size="sm" /> : "Confirm"}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
          {reviewStep === "auditing" && (
            <motion.div
              key="auditing"
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
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
                    <motion.div
                      key={audit}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.2 }}
                    >
                      <div className="flex h-5 w-5 items-center justify-center">
                        {isComplete ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            <IconCircleCheck
                              size={20}
                              className="text-success"
                            />
                          </motion.div>
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
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
          {reviewStep === "complete" && (
            <motion.div
              key="complete"
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader>
                <DialogTitle>Review Sent</DialogTitle>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-surface bg-success/10 p-4 text-center"
              >
                <IconCircleCheck
                  size={24}
                  className="mx-auto mb-2 text-success"
                />
                <p className="text-sm font-medium text-success">
                  This information has automatically been sent to the dev team.
                </p>
              </motion.div>
              <DialogFooter>
                <Button onClick={handleClose}>Done</Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
