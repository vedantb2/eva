"use client";

import { useRef, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
} from "@tabler/icons-react";
import { cn, Dialog, DialogContent, DialogTitle } from "@eva/ui";

export type GalleryImage = { url: string; alt?: string };

/**
 * The lightbox is a fixed dark viewer, not a themed surface: an image reads
 * against a near-black scrim in every appearance, so its scrim and chrome are
 * deliberately hardcoded black/white rather than tokenised. Hoisted here so
 * the exemption is stated once instead of on each of the five call sites.
 */
// design-check-ignore-next-line — fixed dark media scrim, see above
const LIGHTBOX_SCRIM = "bg-black/90";
// design-check-ignore-next-line — fixed dark media scrim, see above
const LIGHTBOX_OVERLAY = "bg-black/60 text-white";
// design-check-ignore-next-line — fixed dark media scrim, see above
const LIGHTBOX_CONTROL =
  "border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70";

/**
 * Twitter-style image gallery for chat messages: up to a 2x2 grid of cropped
 * tiles (a "+N" overlay on the fourth when more exist) instead of a long
 * stack, with a fullscreen lightbox that cycles via arrows, arrow keys, or
 * touch swipe. Videos are rendered separately (VideoPreview) — this is
 * images only.
 */
export function ImageGalleryPreview({ images }: { images: GalleryImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) return null;

  const count = images.length;
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

  const current = lightboxIndex === null ? null : images[lightboxIndex];

  return (
    <>
      {count === 1 ? (
        <button
          type="button"
          onClick={() => showAt(0)}
          className="block max-w-lg"
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
                "relative block cursor-pointer",
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
                  count === 3 && index === 0 ? "min-h-full" : "aspect-[4/3]",
                )}
              />
              {overflow > 0 && index === tiles.length - 1 ? (
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center text-xl font-semibold",
                    LIGHTBOX_OVERLAY,
                  )}
                >
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
          className={cn(
            "h-[92vh] max-w-[96vw] overflow-hidden border-0 p-0 shadow-none sm:max-w-[96vw]",
            LIGHTBOX_SCRIM,
          )}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") step(-1);
            if (event.key === "ArrowRight") step(1);
          }}
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current;
            touchStartX.current = null;
            if (startX === null) return;
            const deltaX =
              (event.changedTouches[0]?.clientX ?? startX) - startX;
            if (deltaX > 48) step(-1);
            if (deltaX < -48) step(1);
          }}
        >
          <DialogTitle className="sr-only">
            {current?.alt ?? "Screenshot"}
          </DialogTitle>
          {current ? (
            <div className="relative flex h-full w-full items-center justify-center">
              <img
                src={current.url}
                alt={current.alt ?? "Screenshot"}
                className="max-h-full max-w-full select-none object-contain"
              />
              {count > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => step(-1)}
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2",
                      LIGHTBOX_CONTROL,
                    )}
                  >
                    <IconChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => step(1)}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2",
                      LIGHTBOX_CONTROL,
                    )}
                  >
                    <IconChevronRight size={22} />
                  </button>
                  <span
                    className={cn(
                      "absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs tabular-nums",
                      LIGHTBOX_OVERLAY,
                    )}
                  >
                    {(lightboxIndex ?? 0) + 1} / {count}
                  </span>
                </>
              ) : null}
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "rounded-control absolute right-12 top-3 inline-flex items-center gap-1 px-2 py-1 text-xs transition-colors",
                  LIGHTBOX_OVERLAY,
                )}
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
