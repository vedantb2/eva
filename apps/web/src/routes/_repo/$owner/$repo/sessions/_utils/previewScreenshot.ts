export type PreviewScreenshotInbound =
  | { type: "screenshot"; requestId: string; dataUrl: string }
  | { type: "error"; requestId: string; message: string };

export function parseScreenshotInbound(
  data: object,
): PreviewScreenshotInbound | null {
  if (!("type" in data) || typeof data.type !== "string") return null;
  if (!("requestId" in data) || typeof data.requestId !== "string") return null;
  if (data.type === "eva-preview-screenshot") {
    if (!("dataUrl" in data) || typeof data.dataUrl !== "string") return null;
    if (!data.dataUrl.startsWith("data:image/")) return null;
    return {
      type: "screenshot",
      requestId: data.requestId,
      dataUrl: data.dataUrl,
    };
  }
  if (data.type === "eva-preview-screenshot-error") {
    if (!("message" in data) || typeof data.message !== "string") return null;
    return { type: "error", requestId: data.requestId, message: data.message };
  }
  return null;
}

export function downloadPreviewScreenshot(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `preview-${Date.now()}.png`;
  link.click();
  URL.revokeObjectURL(url);
}
