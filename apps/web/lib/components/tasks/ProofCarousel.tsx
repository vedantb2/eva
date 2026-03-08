"use client";

import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@conductor/ui";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Proof = FunctionReturnType<typeof api.taskProof.listByTask>[number];

export function ProofCarousel({
  proofs,
}: {
  proofs: FunctionReturnType<typeof api.taskProof.listByTask>;
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const messages = proofs.filter((p) => p.message);
  const mediaProofs = proofs.filter(
    (p) =>
      (p.url && p.contentType?.startsWith("image/")) ||
      (p.url && p.contentType?.startsWith("video/")),
  );

  const handleSelect = () => {
    if (!carouselApi) return;
    setCurrent(carouselApi.selectedScrollSnap());
  };

  const handleApiChange = (api: CarouselApi) => {
    setCarouselApi(api);
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", handleSelect);
  };

  return (
    <div className="space-y-3">
      {messages.map((proof) => (
        <p key={proof._id} className="text-sm text-muted-foreground">
          {proof.message}
        </p>
      ))}

      {mediaProofs.length === 1 && <SingleMediaProof proof={mediaProofs[0]} />}

      {mediaProofs.length > 1 && (
        <div className="space-y-2">
          <Carousel setApi={handleApiChange} opts={{ loop: true }}>
            <CarouselContent>
              {mediaProofs.map((proof) => (
                <CarouselItem key={proof._id}>
                  <SingleMediaProof proof={proof} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-3 bg-background/80 backdrop-blur-sm" />
            <CarouselNext className="-right-3 bg-background/80 backdrop-blur-sm" />
          </Carousel>
          <div className="flex items-center justify-center gap-1.5">
            {mediaProofs.map((proof, index) => (
              <button
                key={proof._id}
                type="button"
                onClick={() => carouselApi?.scrollTo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === current
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/30"
                }`}
              >
                <span className="sr-only">Go to slide {index + 1}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {current + 1} of {mediaProofs.length}
          </p>
        </div>
      )}
    </div>
  );
}

function SingleMediaProof({ proof }: { proof: Proof }) {
  if (proof.url && proof.contentType?.startsWith("image/")) {
    return <ScreenshotPreview url={proof.url} />;
  }
  if (proof.url && proof.contentType?.startsWith("video/")) {
    return <VideoPreview url={proof.url} />;
  }
  return null;
}
