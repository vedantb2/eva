import { isChunkLoadError } from "@/lib/utils/isChunkLoadError";

/**
 * Warm the signed-in shell in parallel with Clerk's handshake. The anonymous
 * landing must not import these modules — they pull Convex, the sidebar, and
 * the preview iframe host into the entry graph.
 */
export function prefetchSignedInChunks(
  onChunkError?: (error: Error) => void,
): void {
  const load = (pending: Promise<unknown>) => {
    void pending.catch((error: Error) => {
      if (isChunkLoadError(error)) onChunkError?.(error);
    });
  };

  load(import("@/lib/components/AppShellChrome"));
  load(import("@/lib/components/ClientProvider"));
  load(import("@/lib/components/sandbox/previewIframeHost"));
  load(import("@/lib/components/sandbox/PreviewMiniPlayer"));
}
