import { useLayoutEffect, useRef, useState } from "react";
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
    const layerRect = layerRef.current.getBoundingClientRect();
    const iframeRect = iframeRef.current.getBoundingClientRect();
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
      left: Math.min(Math.max(8, left), maxLeft),
      top: Math.min(Math.max(8, top), maxTop),
    });
  }, [pending, iframeRef]);

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-10">
      {pending && cardPosition ? (
        <AnnotationCommentCard
          context={pending.context}
          position={cardPosition}
          isSubmitting={isSubmitting}
          onCancel={clearPending}
          onSubmit={(feedback) => {
            const display = buildAnnotationDisplay(feedback, pending.context);
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
      ) : null}
    </div>
  );
}
