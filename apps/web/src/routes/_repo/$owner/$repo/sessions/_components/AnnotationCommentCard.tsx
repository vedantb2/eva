"use client";

import { useState } from "react";
import { Button, Textarea } from "@eva/ui";
import type { PreviewAnnotationContext } from "../_utils/-previewAnnotation";

function elementChip(ctx: PreviewAnnotationContext): string {
  const cls = ctx.classNames[0] ? `.${ctx.classNames[0]}` : "";
  return `<${ctx.tagName}${cls}>`;
}

export function AnnotationCommentCard({
  context,
  position,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  context: PreviewAnnotationContext;
  position: { left: number; top: number };
  onSubmit: (feedback: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [text, setText] = useState("");
  const reactName = context.reactComponents[0];
  const previewText =
    context.textContent.length > 60
      ? `${context.textContent.slice(0, 57)}...`
      : context.textContent;

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    onSubmit(trimmed);
  }

  return (
    <div
      // `w-80` is exactly a 320px viewport, so the card hung off the edge with
      // no gutter. The expression matches `CARD_WIDTH` clamping in
      // `PreviewAnnotationLayer` — keep the two in step.
      className="pointer-events-auto absolute z-20 w-[min(20rem,calc(100vw-2rem))] rounded-lg bg-popover p-3 smooth-shadow-ring-lg"
      style={{ left: position.left, top: position.top }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-foreground">
          {elementChip(context)}
        </span>
        {reactName ? (
          <span className="rounded-md border border-border bg-card px-1.5 py-0.5">
            {reactName}
          </span>
        ) : null}
        {previewText ? (
          <span className="min-w-0 truncate italic">{previewText}</span>
        ) : null}
      </div>
      <Textarea
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What should Eva change?"
        className="min-h-20 resize-none text-sm"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
            return;
          }
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting}
        >
          Send to Eva
        </Button>
      </div>
    </div>
  );
}
