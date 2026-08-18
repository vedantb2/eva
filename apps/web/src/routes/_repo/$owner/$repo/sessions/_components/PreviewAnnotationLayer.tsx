"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWebPreview } from "@eva/ui";
import {
  buildAnnotationDisplay,
  buildAnnotationPrompt,
} from "../_utils/-previewAnnotation";
import { AnnotationCommentCard } from "./AnnotationCommentCard";
import { useAnnotationBridge } from "./useAnnotationBridge";

const CARD_WIDTH = 320;
const CARD_ESTIMATED_HEIGHT = 220;
const CARD_GAP = 8;

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
  const { pending, clearPending } = useAnnotationBridge({
    iframeRef,
    mode,
  });

  // Measured in a layout effect rather than during render: reading
  // getBoundingClientRect from refs mid-render makes React Compiler bail on
  // the whole file, and the DOM nodes are only guaranteed after commit anyway.
  const [cardPosition, setCardPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  useLayoutEffect(() => {
    if (!pending || !layerRef.current || !iframeRef.current) {
      setCardPosition(null);
      return;
    }
    // Viewport coordinates: the card renders in a fixed body portal (z-50)
    // because the preview iframe lives in the fixed z-40 host overlay — an
    // in-panel absolute card would paint underneath it.
    const layerRect = layerRef.current.getBoundingClientRect();
    const iframeRect = iframeRef.current.getBoundingClientRect();
    const left =
      iframeRect.left + pending.rect.left + Math.min(pending.rect.width, 40);
    const top =
      iframeRect.top + pending.rect.top + pending.rect.height + CARD_GAP;
    const minLeft = layerRect.left + 8;
    // The card shrinks to `100vw - 2rem` on a narrow viewport, so clamping
    // against a flat 320px would push it off the right edge on a phone.
    const cardWidth = Math.min(CARD_WIDTH, window.innerWidth - 32);
    const maxLeft = Math.max(minLeft, layerRect.right - cardWidth - 8);
    const minTop = layerRect.top + 8;
    const maxTop = Math.max(minTop, layerRect.bottom - CARD_ESTIMATED_HEIGHT);
    setCardPosition({
      left: Math.min(Math.max(minLeft, left), maxLeft),
      top: Math.min(Math.max(minTop, top), maxTop),
    });
  }, [pending, iframeRef]);

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-10">
      {pending && cardPosition
        ? createPortal(
            <div className="pointer-events-none fixed inset-0 z-50">
              <AnnotationCommentCard
                context={pending.context}
                position={cardPosition}
                isSubmitting={isSubmitting}
                onCancel={clearPending}
                onSubmit={(feedback) => {
                  const display = buildAnnotationDisplay(
                    feedback,
                    pending.context,
                  );
                  const full = buildAnnotationPrompt(feedback, pending.context);
                  setIsSubmitting(true);
                  void onSubmit(display, full)
                    .then(() => {
                      clearPending();
                      onModeChange(false);
                    })
                    .finally(() => {
                      setIsSubmitting(false);
                    });
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
