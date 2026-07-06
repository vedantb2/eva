"use node";

import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { decryptValue } from "./encryption";
import type {
  SandboxCredentials,
  SandboxProviderKind,
} from "./_sandbox/provider";

/** Resolves and decrypts all env vars (team + repo), including sandbox-excluded ones. Repo vars override team vars. */
export async function resolveAllEnvVars(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Record<string, string>> {
  const teamId = await ctx.runQuery(internal.githubRepos.getTeamIdForRepo, {
    repoId,
  });

  const teamEnvVars: Record<string, string> = {};
  if (teamId) {
    const vars = await ctx.runQuery(internal.teamEnvVars.getAllInternal, {
      teamId,
    });
    for (const v of vars) {
      teamEnvVars[v.key] = decryptValue(v.value);
    }
  }

  const repoVars = await ctx.runQuery(internal.repoEnvVars.getAllInternal, {
    repoId,
  });
  const repoEnvVars: Record<string, string> = {};
  for (const v of repoVars) {
    repoEnvVars[v.key] = decryptValue(v.value);
  }

  return { ...teamEnvVars, ...repoEnvVars };
}

/** Resolves and decrypts sandbox-eligible env vars (team + repo). Repo vars override team vars. */
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

/** Extracts the DAYTONA_API_KEY from all env vars and returns it alongside sandbox-eligible env vars. */
export async function resolveDaytonaApiKey(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{ daytonaApiKey: string; sandboxEnvVars: Record<string, string> }> {
  const allVars = await resolveAllEnvVars(ctx, repoId);
  const daytonaApiKey = allVars.DAYTONA_API_KEY;

  if (!daytonaApiKey) {
    throw new Error(
      "DAYTONA_API_KEY not found in team or repo environment variables. Please add it to your team or repo env vars.",
    );
  }

  const sandboxVars = await resolveEnvVars(ctx, repoId);
  return { daytonaApiKey, sandboxEnvVars: sandboxVars };
}

/**
 * Reads the active sandbox provider for a repo from the `SANDBOX_PROVIDER`
 * env var (team or repo scope). Defaults to `daytona` so nothing changes until
 * a repo/team explicitly opts into `vercel`. Any unrecognised value falls back
 * to daytona rather than throwing — the flag should never take a repo offline.
 */
function readProviderKind(
  allVars: Record<string, string>,
): SandboxProviderKind {
  return allVars.SANDBOX_PROVIDER === "vercel" ? "vercel" : "daytona";
}

/**
 * Resolves the active provider and its credentials for a repo, alongside the
 * sandbox-eligible env vars passed into the sandbox. This is the single seam
 * the provider factory uses to pick Daytona vs Vercel; existing callers that
 * only need Daytona keep using {@link resolveDaytonaApiKey}.
 *
 * Throws only when the SELECTED provider's credentials are missing — e.g. a
 * repo flagged `vercel` without `VERCEL_TOKEN` — so a misconfigured flag fails
 * loudly at that repo rather than silently using the wrong backend.
 */
export async function resolveSandboxCredentials(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{
  credentials: SandboxCredentials;
  sandboxEnvVars: Record<string, string>;
}> {
  const allVars = await resolveAllEnvVars(ctx, repoId);
  const kind = readProviderKind(allVars);
  const sandboxEnvVars = await resolveEnvVars(ctx, repoId);

  if (kind === "vercel") {
    const token = allVars.VERCEL_TOKEN;
    const teamId = allVars.VERCEL_TEAM_ID;
    const projectId = allVars.VERCEL_PROJECT_ID;
    if (!token || !teamId || !projectId) {
      throw new Error(
        "SANDBOX_PROVIDER=vercel requires VERCEL_TOKEN, VERCEL_TEAM_ID and VERCEL_PROJECT_ID in team or repo environment variables.",
      );
    }
    return {
      credentials: { kind: "vercel", token, teamId, projectId },
      sandboxEnvVars,
    };
  }

  const apiKey = allVars.DAYTONA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DAYTONA_API_KEY not found in team or repo environment variables. Please add it to your team or repo env vars.",
    );
  }
  return { credentials: { kind: "daytona", apiKey }, sandboxEnvVars };
}
