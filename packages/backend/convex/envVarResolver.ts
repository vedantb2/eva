"use node";

import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { decryptValue } from "./encryption";

export async function resolveEnvVars(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Record<string, string>> {
  const teamId = await ctx.runQuery(internal.githubRepos.getTeamIdForRepo, {
    repoId,
  });

  const teamEnvVars: Record<string, string> = {};
  if (teamId) {
    const vars = await ctx.runQuery(internal.teamEnvVars.getForSandbox, {
      teamId,
    });
    for (const v of vars) {
      teamEnvVars[v.key] = decryptValue(v.value);
    }
  }

  const repoVars = await ctx.runQuery(internal.repoEnvVars.getForSandbox, {
    repoId,
  });
  const repoEnvVars: Record<string, string> = {};
  for (const v of repoVars) {
    repoEnvVars[v.key] = decryptValue(v.value);
  }

  return { ...teamEnvVars, ...repoEnvVars };
}

export async function resolveSandboxApiKey(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{
  sandboxApiKey: string;
  sandboxProviderType: "e2b" | "daytona";
  sandboxEnvVars: Record<string, string>;
}> {
  const envVars = await resolveEnvVars(ctx, repoId);

  const e2bKey = envVars.E2B_API_KEY;
  const daytonaKey = envVars.DAYTONA_API_KEY;

  let sandboxProviderType: "e2b" | "daytona";
  let sandboxApiKey: string;
  if (e2bKey) {
    sandboxProviderType = "e2b";
    sandboxApiKey = e2bKey;
  } else if (daytonaKey) {
    sandboxProviderType = "daytona";
    sandboxApiKey = daytonaKey;
  } else {
    throw new Error(
      "No sandbox API key found. Add E2B_API_KEY or DAYTONA_API_KEY to your team or repo env vars.",
    );
  }

  const sandboxEnvVars = { ...envVars };
  delete sandboxEnvVars.E2B_API_KEY;
  delete sandboxEnvVars.DAYTONA_API_KEY;

  return { sandboxApiKey, sandboxProviderType, sandboxEnvVars };
}
