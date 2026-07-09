import type { SandboxProviderKind } from "./provider";

/** When provider is vercel, only reuse vercelSandboxId (never Daytona sandboxId). */
export function resolveExistingSandboxId(args: {
  providerKind: SandboxProviderKind;
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
}): string | undefined {
  if (args.providerKind === "vercel") {
    return args.vercelSandboxId;
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
