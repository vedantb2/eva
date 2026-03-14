"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
} from "@conductor/ui";
import { IconLoader2 } from "@tabler/icons-react";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Proof = FunctionReturnType<typeof api.taskProof.listByTask>[number];

export function ProofSection({
  proofs,
  status,
}: {
  proofs: FunctionReturnType<typeof api.taskProof.listByTask> | undefined;
  status: string | undefined;
}) {
  const mediaProofs = proofs?.filter(
    (p: Proof) =>
      p.url &&
      (p.contentType?.startsWith("image/") ||
        p.contentType?.startsWith("video/")),
  );
  const messageProofs = proofs?.filter((p: Proof) => p.message);

  return (
    <div className="space-y-3">
      {mediaProofs && mediaProofs.length > 0 ? (
        <div className="px-6">
          <Carousel opts={{ loop: mediaProofs.length > 1 }}>
            <CarouselContent>
              {mediaProofs.map((proof) => (
                <CarouselItem key={proof._id}>
                  {proof.url && proof.contentType?.startsWith("image/") ? (
                    <ScreenshotPreview url={proof.url} />
                  ) : proof.url && proof.contentType?.startsWith("video/") ? (
                    <VideoPreview url={proof.url} />
                  ) : null}
                </CarouselItem>
              ))}
            </CarouselContent>
            {mediaProofs.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
                <CarouselDots />
              </>
            )}
          </Carousel>
        </div>
      ) : null}
      {messageProofs && messageProofs.length > 0
        ? messageProofs.map((proof) => (
            <p key={proof._id} className="text-sm text-muted-foreground">
              {proof.message}
            </p>
          ))
        : null}
      {(!proofs || proofs.length === 0) &&
        (status === "in_progress" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconLoader2 size={14} className="animate-spin" />
            Waiting for proof upload...
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No proof uploaded yet</p>
        ))}
    </div>
  );
}
