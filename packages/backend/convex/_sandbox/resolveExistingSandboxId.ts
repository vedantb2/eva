import type { SandboxProviderKind } from "./provider";

/**
 * When provider is vercel, prefer `vercelSandboxId`. Fall back to `sandboxId`
 * for legacy rows that only persisted the Vercel name on `sandboxId` — without
 * that fallback, resume skips reuse and creates a second sandbox.
 * Never treat a Daytona `sandboxId` as reusable when provider is vercel and
 * `vercelSandboxId` is set (caller already prefers the vercel field).
 */
export function resolveExistingSandboxId(args: {
  providerKind: SandboxProviderKind;
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
}): string | undefined {
  if (args.providerKind === "vercel") {
    return args.vercelSandboxId ?? args.sandboxId;
  }
  return args.sandboxId;
}

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
