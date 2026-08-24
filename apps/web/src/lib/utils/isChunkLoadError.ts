/** Detects errors caused by stale JavaScript chunks after a new deployment. */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message;
  return (
    error.name === "ChunkLoadError" ||
    msg.includes("dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Failed to load module script") ||
    msg.includes("disallowed MIME type") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk")
  );
}
