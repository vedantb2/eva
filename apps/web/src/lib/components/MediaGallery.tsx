"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
} from "@tabler/icons-react";
import { animate, m, useMotionValue } from "motion/react";
import {
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  projectVelocity,
} from "@eva/ui";

export type GalleryImage = { url: string; alt?: string };

/**
 * Twitter-style image gallery for chat messages: up to a 2x2 grid of cropped
 * tiles (a "+N" overlay on the fourth when more exist) instead of a long
 * stack, with a fullscreen lightbox that cycles via arrows, arrow keys, or
 * 1:1 touch/pointer swipe. Videos are rendered separately (VideoPreview) — this
 * is images only.
 */
export function ImageGalleryPreview({ images }: { images: GalleryImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const offsetX = useMotionValue(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const samplesRef = useRef<Array<{ x: number; t: number }>>([]);

  const count = images.length;

  useEffect(() => {
    if (lightboxIndex === null) {
      offsetX.set(0);
    }
  }, [lightboxIndex, offsetX]);

  if (count === 0) return null;

  const tiles = images.slice(0, 4);
  const overflow = count - tiles.length;

  const showAt = (index: number) => setLightboxIndex(index);
  const close = () => setLightboxIndex(null);
  // Wrap-around so the user can circle through the set in either direction.
  const step = (delta: number) => {
    setLightboxIndex((current) =>
      current === null ? current : (current + delta + count) % count,
    );
  };

  const sampleVelocity = (): number => {
    const samples = samplesRef.current;
    if (samples.length < 2) return 0;
    const first = samples[0];
    const last = samples[samples.length - 1];
    if (first === undefined || last === undefined) return 0;
    const dt = last.t - first.t;
    if (dt <= 0) return 0;
    return ((last.x - first.x) / dt) * 1000;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (count <= 1 || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    startXRef.current = event.clientX;
    samplesRef.current = [{ x: event.clientX, t: performance.now() }];
    offsetX.stop();
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = event.clientX - startXRef.current;
    offsetX.set(dx);
    samplesRef.current = [
      ...samplesRef.current.slice(-4),
      { x: event.clientX, t: performance.now() },
    ];
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const dx = offsetX.get();
    const velocity = sampleVelocity();
    const projected = dx + projectVelocity(velocity);
    const goPrev = projected > 64 || velocity > 500;
    const goNext = projected < -64 || velocity < -500;

    if (goPrev || goNext) {
      const target =
        (goNext ? -1 : 1) * Math.max(280, window.innerWidth * 0.45);
      void animate(offsetX, target, {
        type: "spring",
        bounce: 0,
        duration: 0.35,
        velocity,
      }).then(() => {
        step(goNext ? 1 : -1);
        offsetX.set(0);
      });
      return;
    }

    void animate(offsetX, 0, {
      type: "spring",
      bounce: 0,
      duration: 0.35,
      velocity,
    });
  };

  const current = lightboxIndex === null ? null : images[lightboxIndex];

  return (
    <>
      {count === 1 ? (
        <button
          type="button"
          onClick={() => showAt(0)}
          className="block max-w-lg motion-press active:scale-[0.99]"
        >
          <img
            src={images[0]?.url}
            alt={images[0]?.alt ?? "Screenshot"}
            loading="lazy"
            className="media-outline rounded-surface max-h-96 max-w-full cursor-pointer transition-opacity hover:opacity-90"
          />
        </button>
      ) : (
        <div
          className={cn(
            "media-outline rounded-surface grid max-w-lg gap-0.5 overflow-hidden",
            "grid-cols-2",
          )}
        >
          {tiles.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => showAt(index)}
              className={cn(
                "relative block cursor-pointer motion-press active:scale-[0.99]",
                // Three images: first tile spans the left column, Twitter-style.
                count === 3 && index === 0 ? "row-span-2 h-full" : undefined,
              )}
            >
              <img
                src={image.url}
                alt={image.alt ?? `Screenshot ${index + 1}`}
                loading="lazy"
                className={cn(
                  "h-full w-full object-cover transition-opacity hover:opacity-90",
                  count === 3 && index === 0 ? "min-h-full" : "aspect-4/3",
                )}
              />
              {overflow > 0 && index === tiles.length - 1 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xl font-semibold text-white">
                  +{overflow}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent
          className="h-[92dvh] max-w-[96vw] overflow-hidden border-0 bg-black/90 p-0 shadow-none sm:max-w-[96vw]"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") step(-1);
            if (event.key === "ArrowRight") step(1);
          }}
        >
          <DialogTitle className="sr-only">
            {current?.alt ?? "Screenshot"}
          </DialogTitle>
          {current ? (
            <div
              className="relative flex h-full w-full touch-pan-y items-center justify-center"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <m.img
                src={current.url}
                alt={current.alt ?? "Screenshot"}
                draggable={false}
                style={{ x: offsetX }}
                className="max-h-full max-w-full select-none object-contain"
              />
              {count > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => step(-1)}
                    className="hit-target absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2 text-white motion-press active:scale-[0.94] hover:bg-black/70"
                  >
                    <IconChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => step(1)}
                    className="hit-target absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2 text-white motion-press active:scale-[0.94] hover:bg-black/70"
                  >
                    <IconChevronRight size={22} />
                  </button>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs tabular-nums text-white">
                    {(lightboxIndex ?? 0) + 1} / {count}
                  </span>
                </>
              ) : null}
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hit-target absolute right-12 top-3 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white/80 transition-colors hover:text-white"
              >
                <IconExternalLink size={14} />
                Open in new tab
              </a>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
