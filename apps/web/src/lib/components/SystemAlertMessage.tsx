import { useState } from "react";
import { m } from "motion/react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@eva/ui";
import { IconAlertTriangle } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";

interface SystemAlertMessageProps {
  content: string;
  errorDetail?: string;
  timestamp?: number;
}

export function SystemAlertMessage({
  content,
  errorDetail,
  timestamp,
}: SystemAlertMessageProps) {
  const [showError, setShowError] = useState(false);

  return (
    <>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 py-1"
      >
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap max-w-[60%] truncate sm:max-w-none sm:truncate-none">
          {content}
          {timestamp !== undefined ? (
            <>
              <span className="ml-1.5 text-subtle-foreground font-normal">
                ·
              </span>
              <RelativeDateTime
                at={timestamp}
                className="ml-1 text-subtle-foreground font-normal"
              />
            </>
          ) : null}
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
      </m.div>
      {errorDetail && (
        <Dialog open={showError} onOpenChange={setShowError}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconAlertTriangle className="size-4 text-destructive" />
                Sandbox Error
              </DialogTitle>
            </DialogHeader>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted rounded-surface p-4 max-h-64 overflow-y-auto scrollbar scroll-fade">
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
