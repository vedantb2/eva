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

export async function resolveE2bApiKey(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{ e2bApiKey: string; sandboxEnvVars: Record<string, string> }> {
  const envVars = await resolveEnvVars(ctx, repoId);
  const e2bApiKey = envVars.E2B_API_KEY;

  if (!e2bApiKey) {
    throw new Error(
      "E2B_API_KEY not found in team or repo environment variables. Please add it to your team or repo env vars.",
    );
  }

  const sandboxEnvVars = { ...envVars };
  delete sandboxEnvVars.E2B_API_KEY;

  return { e2bApiKey, sandboxEnvVars };
}
