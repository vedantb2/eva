"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@conductor/ui";
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
} from "@tabler/icons-react";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { VideoPreview } from "@/lib/components/MediaPreview";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

export type TaskProof = FunctionReturnType<
  typeof api.taskProof.listByTask
>[number];

const MESSAGE_TRUNCATE = 72;

export function truncateProofMessage(message: string): string {
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MESSAGE_TRUNCATE) return trimmed;
  return `${trimmed.slice(0, MESSAGE_TRUNCATE - 1)}…`;
}

export function isMediaProof(proof: TaskProof): boolean {
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
        className="media-outline mx-auto block h-auto w-auto max-w-none"
      />
    );
  }
  return (
    <div className="p-4">
      <VideoPreview url={proof.url} />
    </div>
  );
}

/** Single-capture or multi-capture gallery dialog. */
export function ProofCaptureGallery({
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
      <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-hidden p-0">
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
            <IconExternalLink size={14} />
            Open in new tab
          </a>
        </DialogHeader>
        <div className="relative">
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
                <IconChevronLeft size={16} />
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
                <IconChevronRight size={16} />
              </Button>
            </>
          ) : null}
          <div className="max-h-[90vh] overflow-auto scrollbar">
            <div className="flex min-h-[50vh] min-w-full items-start justify-center p-4 pt-10">
              <ProofMediaViewer key={current._id} proof={current} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Top-level proof row on the activity timeline rail. */
export function ProofTimelineItem({
  proof,
  showTimestamp = true,
}: {
  proof: TaskProof;
  showTimestamp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasMedia = isMediaProof(proof);
  const messagePreview =
    !hasMedia && proof.message ? truncateProofMessage(proof.message) : null;

  return (
    <>
      <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
        <span className="relative z-10 flex size-4 shrink-0 items-center justify-center bg-background">
          <EvaIcon size={16} />
        </span>
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium text-foreground">
            Eva attached proof
          </span>
          {hasMedia ? (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                View capture
              </button>
            </>
          ) : messagePreview ? (
            <span className="text-muted-foreground"> — {messagePreview}</span>
          ) : null}
        </span>
        {showTimestamp ? (
          <RelativeDateTime
            at={proof.createdAt}
            className="shrink-0 text-muted-foreground/70"
          />
        ) : null}
      </div>
      {hasMedia ? (
        <ProofCaptureGallery
          proofs={[proof]}
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}
    </>
  );
}
