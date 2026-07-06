"use node";

/**
 * Provider factory: turns resolved {@link SandboxCredentials} into a concrete
 * {@link SandboxClient}. This is the single switch point between backends — the
 * rest of the code depends only on the neutral contract in ./provider.ts.
 *
 * Credentials come from `resolveSandboxCredentials` in ../envVarResolver.ts,
 * which reads the per-repo/team `SANDBOX_PROVIDER` flag (default daytona).
 */

import type { SandboxClient, SandboxCredentials } from "./provider";
import { createDaytonaClient } from "./daytonaProvider";

/** Returns the sandbox client for the given credentials' provider. */
export function getSandboxClient(
  credentials: SandboxCredentials,
): SandboxClient {
  switch (credentials.kind) {
    case "daytona":
      return createDaytonaClient(credentials.apiKey);
    case "vercel":
      // Phase 2: implemented once the Vercel adapter lands. Until then a repo
      // flagged `vercel` fails loudly here rather than silently using Daytona.
      throw new Error(
        "Vercel sandbox provider is not implemented yet (migration Phase 2).",
      );
  }
}
