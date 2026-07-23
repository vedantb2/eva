"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useWebPreview } from "@conductor/ui";
import {
  buildAnnotationDisplay,
  buildAnnotationPrompt,
} from "../_utils/-previewAnnotation";
import { AnnotationCommentCard } from "./AnnotationCommentCard";
import { useAnnotationBridge } from "./useAnnotationBridge";

const CARD_WIDTH = 320;
const CARD_ESTIMATED_HEIGHT = 220;
const CARD_GAP = 8;

type CardPosition = { left: number; top: number };

export function PreviewAnnotationLayer({
  mode,
  onModeChange,
  onSubmit,
}: {
  mode: boolean;
  onModeChange: (active: boolean) => void;
  onSubmit: (display: string, full: string) => Promise<void>;
}) {
  const { iframeRef } = useWebPreview();
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardPosition, setCardPosition] = useState<CardPosition | null>(null);
  const { pending, clearPending } = useAnnotationBridge({
    iframeRef,
    mode,
  });

  useLayoutEffect(() => {
    if (!pending) {
      setCardPosition(null);
      return;
    }
    const layer = layerRef.current;
    const iframe = iframeRef.current;
    if (!layer || !iframe) {
      setCardPosition(null);
      return;
    }
    const layerRect = layer.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    const left =
      iframeRect.left -
      layerRect.left +
      pending.rect.left +
      Math.min(pending.rect.width, 40);
    const top =
      iframeRect.top -
      layerRect.top +
      pending.rect.top +
      pending.rect.height +
      CARD_GAP;
    const maxLeft = Math.max(0, layerRect.width - CARD_WIDTH - 8);
    const maxTop = Math.max(0, layerRect.height - CARD_ESTIMATED_HEIGHT);
    setCardPosition({
      left: Math.max(8, Math.min(left, maxLeft)),
      top: Math.max(8, Math.min(top, maxTop)),
    });
  }, [pending, iframeRef]);

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-20">
      {pending && cardPosition ? (
        <div
          className="pointer-events-auto absolute"
          style={{ left: cardPosition.left, top: cardPosition.top }}
        >
          <AnnotationCommentCard
            width={CARD_WIDTH}
            isSubmitting={isSubmitting}
            onCancel={() => {
              clearPending();
              onModeChange(false);
            }}
            onSubmit={async (comment) => {
              setIsSubmitting(true);
              try {
                const display = buildAnnotationDisplay(pending, comment);
                const full = buildAnnotationPrompt(pending, comment);
                await onSubmit(display, full);
                clearPending();
                onModeChange(false);
              } catch (error) {
                setIsSubmitting(false);
                throw error;
              }
              setIsSubmitting(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
