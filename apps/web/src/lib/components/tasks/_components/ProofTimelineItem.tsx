"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@conductor/ui";
import dayjs from "@conductor/shared/dates";
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
        className="rounded-surface border border-border bg-card px-3"
      >
        <AccordionTrigger>
          <div className="flex flex-1 items-center gap-2 mr-2 min-w-0">
            <LogoMark size={16} />
            <span className="font-medium text-sm truncate">
              Eva attached proof
            </span>
            <span className="text-xs text-muted-foreground shrink-0 ml-auto">
              {dayjs(proof.createdAt).format("DD/MM/YYYY HH:mm")}
            </span>
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
