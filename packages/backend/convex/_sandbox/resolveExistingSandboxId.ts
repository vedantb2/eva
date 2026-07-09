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
