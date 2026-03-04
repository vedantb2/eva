"use client";

import { useRef, useState } from "react";
import { IconExternalLink } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@conductor/ui";

const VIDEO_SPEEDS = [1, 2, 3, 5] as const;

export function VideoPreview({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState<(typeof VIDEO_SPEEDS)[number]>(3);

  const applySpeed = (rate: (typeof VIDEO_SPEEDS)[number]) => {
    setSpeed(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      videoRef.current.defaultPlaybackRate = rate;
    }
  };

  return (
    <div className="space-y-1.5">
      <video
        ref={videoRef}
        src={url}
        controls
        playsInline
        preload="metadata"
        className="rounded-lg border max-w-lg"
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            videoRef.current.defaultPlaybackRate = speed;
          }
        }}
        onPlay={() => {
          if (videoRef.current && videoRef.current.playbackRate !== speed) {
            videoRef.current.playbackRate = speed;
          }
        }}
      />
      <div className="flex items-center gap-1">
        {VIDEO_SPEEDS.map((rate) => (
          <button
            key={rate}
            type="button"
            onClick={() => applySpeed(rate)}
            className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
              speed === rate
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {rate}x
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScreenshotPreview({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block">
        <img
          src={url}
          alt="Screenshot"
          className="rounded-lg max-w-lg border cursor-pointer hover:opacity-90 transition-opacity"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Screenshot Preview</DialogTitle>
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
            alt="Screenshot"
            className="w-full h-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
