"use client";

import { useState } from "react";
import { IconExternalLink } from "@tabler/icons-react";
import {
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerFullscreenButton,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerPlaybackRateButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@eva/ui";

export function VideoPreview({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  return (
    <VideoPlayer className={cn("max-w-full", className)}>
      <VideoPlayerContent
        src={url}
        playsInline
        preload="metadata"
        slot="media"
      />
      <VideoPlayerControlBar>
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBackwardButton />
        <VideoPlayerSeekForwardButton />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay showDuration />
        <VideoPlayerPlaybackRateButton rates={[1, 3, 5, 8]} />
        <VideoPlayerMuteButton />
        <VideoPlayerVolumeRange />
        <VideoPlayerFullscreenButton />
      </VideoPlayerControlBar>
    </VideoPlayer>
  );
}

export function ScreenshotPreview({
  url,
  alt = "Screenshot",
  className,
}: {
  url: string;
  alt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block">
        <img
          src={url}
          alt={alt}
          className={cn(
            "media-outline rounded-surface max-w-full cursor-pointer transition-opacity hover:opacity-90",
            className,
          )}
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <DialogHeader className="absolute top-2 right-10 z-10">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconExternalLink size={14} />
              Open in new tab
            </a>
          </DialogHeader>
          <img
            src={url}
            alt={alt}
            className="media-outline h-full w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
