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
import { useRepo } from "@/lib/contexts/RepoContext";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Proof = FunctionReturnType<typeof api.taskProof.listByTask>[number];

export function ProofSection({
  proofs,
  status,
  isQuickTask,
}: {
  proofs: FunctionReturnType<typeof api.taskProof.listByTask> | undefined;
  status: string | undefined;
  isQuickTask: boolean;
}) {
  const { basePath, repo } = useRepo();
  const mediaProofs = proofs?.filter(
    (p: Proof) =>
      p.url &&
      (p.contentType?.startsWith("image/") ||
        p.contentType?.startsWith("video/")),
  );
  const messageProofs = proofs?.filter((p: Proof) => p.message);
  const hasProofContent =
    (mediaProofs?.length ?? 0) > 0 || (messageProofs?.length ?? 0) > 0;
  const screenshotsVideosEnabled = repo.screenshotsVideosEnabled ?? true;

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
      {!hasProofContent && isQuickTask && !screenshotsVideosEnabled ? (
        <p className="text-sm text-muted-foreground">
          Screenshots and Videos have been disabled. To enable go to the{" "}
          <a
            href={`${basePath}/settings/config`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            config page
          </a>
          .
        </p>
      ) : (
        (!proofs || proofs.length === 0) &&
        (status === "in_progress" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconLoader2 size={14} className="animate-spin" />
            Waiting for proof upload...
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No proof uploaded yet</p>
        ))
      )}
    </div>
  );
}
