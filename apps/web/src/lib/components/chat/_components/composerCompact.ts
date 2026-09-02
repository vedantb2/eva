import { isEditorValueEmpty } from "@/lib/components/mentions";

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureCtx) return measureCtx;
  if (typeof document === "undefined") return null;
  const context = document.createElement("canvas").getContext("2d");
  if (context === null) return null;
  measureCtx = context;
  return context;
}

/** Pill while the draft is one visual line; attachments still need the stacked card. */
export function isComposerCompact({
  value,
  fileCount,
  exceedsPill,
}: {
  value: string;
  fileCount: number;
  exceedsPill: boolean;
}): boolean {
  if (fileCount > 0) return false;
  if (isEditorValueEmpty(value)) return true;
  if (value.includes("\n")) return false;
  return !exceedsPill;
}

export function editorOverflowsHorizontally(editor: HTMLElement): boolean {
  return editor.scrollWidth > editor.clientWidth + 1;
}

export function readEditorInnerWidth(editor: HTMLElement): number {
  const style = getComputedStyle(editor);
  const pad =
    (Number.parseFloat(style.paddingLeft) || 0) +
    (Number.parseFloat(style.paddingRight) || 0);
  return Math.max(0, editor.clientWidth - pad);
}

/** True when a single-line draft is wider than the pill editor's inner width. */
export function draftExceedsPillWidth(
  text: string,
  widthPx: number,
  font: string,
): boolean {
  if (widthPx <= 0 || text.length === 0) return false;
  const ctx = getMeasureContext();
  if (ctx === null) return false;
  ctx.font = font;
  return ctx.measureText(text).width > widthPx;
}
