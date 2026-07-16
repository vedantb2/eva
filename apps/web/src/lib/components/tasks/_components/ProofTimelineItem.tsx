"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@conductor/ui";
import { IconExternalLink } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { LogoMark } from "@/lib/components/LogoMark";
import { VideoPreview } from "@/lib/components/MediaPreview";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Proof = FunctionReturnType<typeof api.taskProof.listByTask>[number];

const MESSAGE_TRUNCATE = 72;

function truncateMessage(message: string): string {
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MESSAGE_TRUNCATE) return trimmed;
  return `${trimmed.slice(0, MESSAGE_TRUNCATE - 1)}…`;
}

export function ProofTimelineItem({ proof }: { proof: Proof }) {
  const [open, setOpen] = useState(false);
  const isImage = Boolean(proof.url && proof.contentType?.startsWith("image/"));
  const isVideo = Boolean(proof.url && proof.contentType?.startsWith("video/"));
  const hasMedia = isImage || isVideo;
  const messagePreview =
    !hasMedia && proof.message ? truncateMessage(proof.message) : null;

  return (
    <>
      <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
        <LogoMark size={16} className="shrink-0" />
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
        <RelativeDateTime
          at={proof.createdAt}
          className="shrink-0 text-muted-foreground/70"
        />
      </div>

      {hasMedia && proof.url ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-hidden p-0">
            <DialogTitle className="sr-only">Eva attached proof</DialogTitle>
            <DialogHeader className="absolute right-10 top-2 z-10">
              <a
                href={proof.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <IconExternalLink size={14} />
                Open in new tab
              </a>
            </DialogHeader>
            {isImage ? (
              <img
                src={proof.url}
                alt="Eva attached proof"
                className="media-outline h-full w-full object-contain"
              />
            ) : (
              <div className="p-4">
                <VideoPreview url={proof.url} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
