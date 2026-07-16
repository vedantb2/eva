"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@conductor/ui";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { LogoMark } from "@/lib/components/LogoMark";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Proof = FunctionReturnType<typeof api.taskProof.listByTask>[number];

export function ProofTimelineItem({ proof }: { proof: Proof }) {
  return (
    <Accordion type="multiple">
      <AccordionItem
        value={`proof-${proof._id}`}
        className="rounded-surface bg-muted/40 px-3"
      >
        <AccordionTrigger>
          <div className="flex flex-1 items-center gap-2 mr-2 min-w-0">
            <LogoMark size={16} />
            <span className="font-medium text-sm truncate">
              Eva attached proof
            </span>
            <RelativeDateTime
              at={proof.createdAt}
              className="shrink-0 text-xs ml-auto"
            />
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {proof.url && proof.contentType?.startsWith("image/") ? (
            <ScreenshotPreview url={proof.url} />
          ) : proof.url && proof.contentType?.startsWith("video/") ? (
            <VideoPreview url={proof.url} />
          ) : proof.message ? (
            <p className="text-sm text-muted-foreground">{proof.message}</p>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
