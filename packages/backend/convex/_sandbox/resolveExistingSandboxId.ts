/**
 * Picks the persisted sandbox id to reuse for Vercel start/resume.
 *
 * Prefer `vercelSandboxId`. Fall back to `sandboxId` when it is a Vercel name
 * (not a legacy Daytona UUID) — missing `vercelSandboxId` used to skip reuse
 * and create a second sandbox while still logging the old Daytona id.
 *
 * KEEP the DAYTONA_UUID guard until legacy data cleanup
 * (`internal/plans/todo/daytona-legacy-data-cleanup.md`) nulls Daytona UUIDs
 * out of `sandboxId` fields.
 */
export function resolveExistingSandboxId(args: {
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
}): string | undefined {
  return resolveReusableVercelSandboxId(args);
}

/**
 * Picks the id to use when reading persisted entity fields.
 * Prefer vercelSandboxId when present.
 */
export function preferPersistedSandboxId(args: {
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
}): string | undefined {
  return args.vercelSandboxId ?? args.sandboxId;
}

/** Legacy Daytona sandbox ids are UUIDs; Vercel names are not. */
const DAYTONA_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves the reusable Vercel sandbox id from a persisted entity's fields for a
 * start/resume flow. Prefers `vercelSandboxId`; falls back to `sandboxId` when it
 * is a Vercel name (not a Daytona UUID).
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
