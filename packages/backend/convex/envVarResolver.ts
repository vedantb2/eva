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

/** All repos in the same codebase (owner/name), requested repo first. */
async function listMonorepoRepoIds(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Array<Id<"githubRepos">>> {
  const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
    id: repoId,
  });
  if (!repo) return [repoId];
  const siblingIds = await ctx.runQuery(
    internal.githubRepos.listRepoIdsByOwnerAndName,
    { owner: repo.owner, name: repo.name },
  );
  if (siblingIds.length === 0) return [repoId];
  return [repoId, ...siblingIds.filter((id) => id !== repoId)];
}

/** Provider kind from one repo's team + repo env (no sibling walk). */
async function resolveSandboxProviderKindForRepo(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<SandboxProviderKind> {
  const [teamId, repoVars] = await Promise.all([
    ctx.runQuery(internal.githubRepos.getTeamIdForRepo, { repoId }),
    ctx.runQuery(internal.repoEnvVars.getAllInternal, { repoId }),
  ]);
  let kind: SandboxProviderKind = "daytona";
  if (teamId) {
    const teamVars = await ctx.runQuery(internal.teamEnvVars.getAllInternal, {
      teamId,
    });
    const teamEntry = teamVars.find(
      (entry) => entry.key === "SANDBOX_PROVIDER",
    );
    if (teamEntry && decryptValue(teamEntry.value) === "vercel") {
      kind = "vercel";
    }
  }
  const repoEntry = repoVars.find((entry) => entry.key === "SANDBOX_PROVIDER");
  if (repoEntry) {
    kind = decryptValue(repoEntry.value) === "vercel" ? "vercel" : "daytona";
  }
  return kind;
}

/**
 * Cheap provider-kind lookup for workflow thaw routing. Only decrypts the
 * `SANDBOX_PROVIDER` key (repo overrides team) instead of the full env map —
 * measured `getSandboxProviderKind` was spending multi-seconds decrypting
 * every team/repo var before kickoff, which left the UI on "Eva is inferring…".
 *
 * Walks monorepo siblings so `SANDBOX_PROVIDER=vercel` on apps/web applies to
 * apps/eprocurement and the shared parent config repo too.
 */
export async function resolveSandboxProviderKind(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<SandboxProviderKind> {
  const startedAt = Date.now();
  const repoIds = await listMonorepoRepoIds(ctx, repoId);
  for (const id of repoIds) {
    const kind = await resolveSandboxProviderKindForRepo(ctx, id);
    if (kind === "vercel") {
      console.log(
        `[env] resolveSandboxProviderKind repoId=${repoId} kind=vercel credentialRepoId=${id} elapsed=${Date.now() - startedAt}ms`,
      );
      return "vercel";
    }
  }
  console.log(
    `[env] resolveSandboxProviderKind repoId=${repoId} kind=daytona elapsed=${Date.now() - startedAt}ms`,
  );
  return "daytona";
}

const CREDENTIAL_ENV_KEYS = [
  "SANDBOX_PROVIDER",
  "VERCEL_TOKEN",
  "VERCEL_TEAM_ID",
  "VERCEL_PROJECT_ID",
  "DAYTONA_API_KEY",
] as const;

/**
 * Decrypts only provider credential keys from an encrypted env-var list.
 * Kickoff/thaw must not pay for decrypting the full team+repo env map.
 */
function decryptCredentialKeys(
  vars: Array<{ key: string; value: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of vars) {
    for (const key of CREDENTIAL_ENV_KEYS) {
      if (entry.key === key) {
        out[key] = decryptValue(entry.value);
        break;
      }
    }
  }
  return out;
}

/**
 * Resolves only the selected provider's credentials (no full sandbox env map).
 * Used by kickoff/thaw paths that only need to call the provider SDK.
 */
export async function resolveSandboxCredentialsOnly(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<SandboxCredentials> {
  const startedAt = Date.now();
  const repoIds = await listMonorepoRepoIds(ctx, repoId);
  let sawVercelFlag = false;

  for (const credentialRepoId of repoIds) {
    const [teamId, repoVarsRaw] = await Promise.all([
      ctx.runQuery(internal.githubRepos.getTeamIdForRepo, {
        repoId: credentialRepoId,
      }),
      ctx.runQuery(internal.repoEnvVars.getAllInternal, {
        repoId: credentialRepoId,
      }),
    ]);
    const teamVars: Record<string, string> = {};
    if (teamId) {
      const vars = await ctx.runQuery(internal.teamEnvVars.getAllInternal, {
        teamId,
      });
      Object.assign(teamVars, decryptCredentialKeys(vars));
    }
    const allVars = {
      ...teamVars,
      ...decryptCredentialKeys(repoVarsRaw),
    };
    if (readProviderKind(allVars) === "vercel") {
      sawVercelFlag = true;
      const token = allVars.VERCEL_TOKEN;
      const vercelTeamId = allVars.VERCEL_TEAM_ID;
      const projectId = allVars.VERCEL_PROJECT_ID;
      if (!token || !vercelTeamId || !projectId) {
        continue;
      }
      console.log(
        `[env] resolveSandboxCredentialsOnly repoId=${repoId} kind=vercel credentialRepoId=${credentialRepoId} elapsed=${Date.now() - startedAt}ms`,
      );
      return { kind: "vercel", token, teamId: vercelTeamId, projectId };
    }
  }

  if (sawVercelFlag) {
    throw new Error(
      "SANDBOX_PROVIDER=vercel is set on this monorepo but VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID are not all configured on the same repo or team.",
    );
  }

  for (const credentialRepoId of repoIds) {
    const allVars = await resolveAllEnvVars(ctx, credentialRepoId);
    const apiKey = allVars.DAYTONA_API_KEY;
    if (apiKey) {
      console.log(
        `[env] resolveSandboxCredentialsOnly repoId=${repoId} kind=daytona credentialRepoId=${credentialRepoId} elapsed=${Date.now() - startedAt}ms`,
      );
      return { kind: "daytona", apiKey };
    }
  }

  throw new Error(
    "DAYTONA_API_KEY not found in team or repo environment variables. Please add it to your team or repo env vars.",
  );
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
  const sandboxEnvVars = await resolveEnvVars(ctx, repoId);
  const repoIds = await listMonorepoRepoIds(ctx, repoId);
  let sawVercelFlag = false;

  for (const credentialRepoId of repoIds) {
    const allVars = await resolveAllEnvVars(ctx, credentialRepoId);
    if (readProviderKind(allVars) === "vercel") {
      sawVercelFlag = true;
      const token = allVars.VERCEL_TOKEN;
      const teamId = allVars.VERCEL_TEAM_ID;
      const projectId = allVars.VERCEL_PROJECT_ID;
      if (!token || !teamId || !projectId) {
        continue;
      }
      return {
        credentials: { kind: "vercel", token, teamId, projectId },
        sandboxEnvVars,
      };
    }
  }

  if (sawVercelFlag) {
    throw new Error(
      "SANDBOX_PROVIDER=vercel is set on this monorepo but VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID are not all configured on the same repo or team.",
    );
  }

  for (const credentialRepoId of repoIds) {
    const allVars = await resolveAllEnvVars(ctx, credentialRepoId);
    const apiKey = allVars.DAYTONA_API_KEY;
    if (apiKey) {
      return {
        credentials: { kind: "daytona", apiKey },
        sandboxEnvVars,
      };
    }
  }

  throw new Error(
    "DAYTONA_API_KEY not found in team or repo environment variables. Please add it to your team or repo env vars.",
  );
}
