"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@conductor/ui";
import { IconAlertTriangle } from "@tabler/icons-react";

interface SystemAlertMessageProps {
  content: string;
  errorDetail?: string;
}

export function SystemAlertMessage({
  content,
  errorDetail,
}: SystemAlertMessageProps) {
  const [showError, setShowError] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 py-1"
      >
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap max-w-[60%] truncate sm:max-w-none sm:truncate-none">
          {content}
        </span>
        {errorDetail && (
          <button
            onClick={() => setShowError(true)}
            className="text-xs font-medium text-destructive hover:underline whitespace-nowrap"
          >
            View error
          </button>
        )}
        <div className="h-px flex-1 bg-border" />
      </motion.div>
      {errorDetail && (
        <Dialog open={showError} onOpenChange={setShowError}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconAlertTriangle size={16} className="text-destructive" />
                Sandbox Error
              </DialogTitle>
            </DialogHeader>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
              {errorDetail}
            </pre>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowError(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
