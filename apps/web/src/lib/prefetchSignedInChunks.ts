import { isChunkLoadError } from "@/lib/utils/isChunkLoadError";

function load(
  pending: Promise<unknown>,
  onChunkError?: (error: Error) => void,
): void {
  void pending.catch((error: Error) => {
    if (isChunkLoadError(error)) onChunkError?.(error);
  });
}

/**
 * Warm the signed-in shell in parallel with Clerk's handshake. Preview
 * iframe modules stay off this list — they are not on the home LCP path
 * and prefetching them was delaying first paint (see `prefetchPreviewChunksWhenIdle`).
 */
export function prefetchSignedInChunks(
  onChunkError?: (error: Error) => void,
): void {
  load(import("@/lib/components/AppShellChrome"), onChunkError);
  load(import("@/lib/components/ClientProvider"), onChunkError);
}

/** Start the preview host after the first frame so it cannot steal LCP bandwidth. */
export function prefetchPreviewChunksWhenIdle(
  onChunkError?: (error: Error) => void,
): void {
  const run = () => {
    load(
      import("@/lib/components/sandbox/previewIframeHost"),
      onChunkError,
    );
    load(
      import("@/lib/components/sandbox/PreviewMiniPlayer"),
      onChunkError,
    );
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 2500 });
    return;
  }
  window.setTimeout(run, 1);
}
