"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Spinner,
  ActivityTasks,
} from "@eva/ui";
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
} from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { VideoPreview } from "@/lib/components/MediaPreview";
import { parseActivitySteps } from "@eva/shared/parseActivitySteps";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";

export type TaskProof = FunctionReturnType<
  typeof api.taskProof.listByTask
>[number];

const MESSAGE_TRUNCATE = 72;
const PROOF_ACCORDION_SCROLL_CLASS =
  "max-h-60 overflow-y-auto overflow-x-hidden scrollbar";

function truncateProofMessage(message: string): string {
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MESSAGE_TRUNCATE) return trimmed;
  return `${trimmed.slice(0, MESSAGE_TRUNCATE - 1)}…`;
}

function isMediaProof(proof: TaskProof): boolean {
  if (!proof.url) return false;
  return Boolean(
    proof.contentType?.startsWith("image/") ||
    proof.contentType?.startsWith("video/"),
  );
}

function ProofMediaViewer({ proof }: { proof: TaskProof }) {
  if (!proof.url) return null;
  if (proof.contentType?.startsWith("image/")) {
    return (
      <img
        src={proof.url}
        alt={proof.fileName ?? "Eva attached proof"}
        className="media-outline mx-auto block max-h-[calc(90vh-3rem)] max-w-full object-contain"
      />
    );
  }
  return (
    <div className="flex max-h-[calc(90vh-3rem)] max-w-full items-center justify-center p-4">
      <VideoPreview url={proof.url} className="max-h-full max-w-full" />
    </div>
  );
}

/** Single-capture or multi-capture gallery dialog. */
function ProofCaptureGallery({
  proofs,
  open,
  onOpenChange,
}: {
  proofs: TaskProof[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(proofs.length - 1, 0));
  const current = proofs[safeIndex];

  if (!current?.url) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setIndex(0);
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden p-0">
        <DialogTitle className="sr-only">
          {proofs.length > 1
            ? `Eva attached proofs (${safeIndex + 1} of ${proofs.length})`
            : "Eva attached proof"}
        </DialogTitle>
        <DialogHeader className="absolute right-10 top-2 z-10 flex flex-row items-center gap-2">
          {proofs.length > 1 ? (
            <span className="rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground">
              {safeIndex + 1} / {proofs.length}
            </span>
          ) : null}
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconExternalLink className="size-3.5" />
            Open in new tab
          </a>
        </DialogHeader>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {proofs.length > 1 ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2"
                disabled={safeIndex === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                aria-label="Previous capture"
              >
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2"
                disabled={safeIndex >= proofs.length - 1}
                onClick={() =>
                  setIndex((i) => Math.min(proofs.length - 1, i + 1))
                }
                aria-label="Next capture"
              >
                <IconChevronRight className="size-4" />
              </Button>
            </>
          ) : null}
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 pt-10">
            <ProofMediaViewer key={current._id} proof={current} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProofActivityLog({ runId }: { runId: Id<"agentRuns"> }) {
  const activityLog = useQuery(api.audits.getActivityLog, {
    runId,
    type: "proof",
  });
  if (activityLog === undefined) return <Spinner size="sm" />;
  if (activityLog === null) return null;
  const steps = parseActivitySteps(activityLog);
  return steps ? (
    <div className={PROOF_ACCORDION_SCROLL_CLASS}>
      <ActivityTasks steps={steps} />
    </div>
  ) : null;
}

/**
 * Top-level proof row on the activity timeline rail. Media proofs with a run
 * expand to show the dedicated proof-capture activity log (separate from the
 * make-changes / run accordion).
 */
export function ProofTimelineItem({
  proofs,
  showTimestamp = true,
}: {
  proofs: TaskProof[];
  showTimestamp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const mediaProofs = proofs.filter(isMediaProof);
  const hasMedia = mediaProofs.length > 0;
  const primary = proofs[0];
  const runId = proofs.find((p) => p.runId)?.runId;
  const timestamp = Math.max(...proofs.map((p) => p.createdAt));
  const messagePreview =
    !hasMedia && primary?.message
      ? truncateProofMessage(primary.message)
      : null;

  const title =
    mediaProofs.length > 1
      ? `Eva attached ${mediaProofs.length} proofs`
      : "Eva attached proof";

  const header = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5 text-xs">
      <span className="font-medium text-foreground">{title}</span>
      {hasMedia ? (
        <>
          <span className="text-muted-foreground"> </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            View capture{mediaProofs.length > 1 ? "s" : ""}
          </button>
        </>
      ) : messagePreview ? (
        <span className="text-muted-foreground"> — {messagePreview}</span>
      ) : null}
      {showTimestamp ? (
        <>
          <span className="text-subtle-foreground" aria-hidden>
            {" "}
            ·{" "}
          </span>
          <RelativeDateTime at={timestamp} className="text-subtle-foreground" />
        </>
      ) : null}
    </div>
  );

  return (
    <>
      {runId ? (
        <Accordion type="multiple" defaultValue={[]}>
          <AccordionItem value={runId} className="border-none">
            <div className="flex gap-2">
              <div className="relative z-10 flex w-4 shrink-0 items-start justify-center bg-background pt-1.5">
                <EvaIcon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <AccordionTrigger className="py-1.5">
                  <div className="mr-2 min-w-0 flex-1">{header}</div>
                </AccordionTrigger>
              </div>
            </div>
            <AccordionContent>
              <div className="ml-6 space-y-2 pb-2">
                <ProofActivityLog runId={runId} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
          <span className="relative z-10 flex size-4 shrink-0 items-center justify-center bg-background">
            <EvaIcon size={16} />
          </span>
          <span className="min-w-0 flex-1 truncate">{header}</span>
        </div>
      )}
      {hasMedia ? (
        <ProofCaptureGallery
          proofs={mediaProofs}
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}
    </>
  );
}
