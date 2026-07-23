"use node";

/**
 * Provider factory: turns resolved {@link SandboxCredentials} into a concrete
 * {@link SandboxClient}. Vercel is the sole sandbox provider; credentials come
 * from `resolveSandboxCredentials` in ../envVarResolver.ts.
 */

import type { SandboxClient, SandboxCredentials } from "./provider";
import { createVercelClient } from "./vercelProvider";

/** Returns the Vercel sandbox client for the given credentials. */
export function getSandboxClient(
  credentials: SandboxCredentials,
): SandboxClient {
  return createVercelClient({
    token: credentials.token,
    teamId: credentials.teamId,
    projectId: credentials.projectId,
  });
}
