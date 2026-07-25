/**
 * Picks the id to use when the provider kind is unknown (e.g. query helpers).
 * Prefer vercelSandboxId when present — on Vercel both fields are the same name
 * after create; on Daytona vercelSandboxId is unset so sandboxId wins.
 */
export function preferPersistedSandboxId(args: {
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
}): string | undefined {
  return args.vercelSandboxId ?? args.sandboxId;
}

const DAYTONA_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves the reusable Vercel sandbox id from a persisted entity's fields for a
 * start/resume flow. Prefers `vercelSandboxId`; falls back to `sandboxId` when it
 * is a Vercel name (not a Daytona UUID). A missing `vercelSandboxId` used to skip
 * reuse and create a second sandbox while still logging the old `sandboxId`.
 */
export function resolveReusableVercelSandboxId(args: {
  sandboxId?: string;
  vercelSandboxId?: string;
}): string | undefined {
  const looksLikeDaytonaUuid =
    typeof args.sandboxId === "string" && DAYTONA_UUID.test(args.sandboxId);
  return (
    args.vercelSandboxId ??
    (args.sandboxId && !looksLikeDaytonaUuid ? args.sandboxId : undefined)
  );
}
