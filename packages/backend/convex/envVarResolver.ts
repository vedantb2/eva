"use node";

import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { decryptValue } from "./encryption";
import { getAIModelProvider } from "./validators";
import type { SandboxCredentials } from "./_sandbox/provider";

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

/**
 * Collects Vercel token/team from the target repo and monorepo siblings, but
 * VERCEL_PROJECT_ID only from the target repo. Sibling apps often share token +
 * team via team env vars, while each app has its own Vercel project — borrowing
 * a sibling's project id creates sandboxes under the wrong app.
 */
async function resolveVercelCredentialsForRepo(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Extract<SandboxCredentials, { kind: "vercel" }>> {
  const targetVars = await resolveAllEnvVars(ctx, repoId);
  const projectId = targetVars.VERCEL_PROJECT_ID;
  let token = targetVars.VERCEL_TOKEN;
  let teamId = targetVars.VERCEL_TEAM_ID;

  if (!token || !teamId) {
    const repoIds = await listMonorepoRepoIds(ctx, repoId);
    for (const siblingId of repoIds) {
      if (siblingId === repoId) continue;
      const siblingVars = await resolveAllEnvVars(ctx, siblingId);
      token = token ?? siblingVars.VERCEL_TOKEN;
      teamId = teamId ?? siblingVars.VERCEL_TEAM_ID;
      if (token && teamId) break;
    }
  }

  if (!token || !teamId || !projectId) {
    const missing: string[] = [];
    if (!token) missing.push("VERCEL_TOKEN");
    if (!teamId) missing.push("VERCEL_TEAM_ID");
    if (!projectId) missing.push("VERCEL_PROJECT_ID");
    throw new Error(
      `Vercel sandbox credentials missing: ${missing.join(", ")}. ` +
        `VERCEL_PROJECT_ID must be set on this app repo (not borrowed from a sibling).`,
    );
  }
  return { kind: "vercel", token, teamId, projectId };
}

/**
 * Resolves the sandbox provider credentials (no full sandbox env map). Used
 * by kickoff/thaw paths that only need to call the provider SDK. Vercel is
 * the only provider, so this always resolves Vercel credentials.
 */
export async function resolveSandboxCredentialsOnly(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<SandboxCredentials> {
  return resolveVercelCredentialsForRepo(ctx, repoId);
}

/**
 * Resolves the sandbox provider credentials for a repo, alongside the
 * sandbox-eligible env vars passed into the sandbox.
 *
 * `VERCEL_PROJECT_ID` always comes from the target app repo so eprocurement
 * never creates sandboxes under apps/web's Vercel project.
 */
export async function resolveSandboxCredentials(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{
  credentials: SandboxCredentials;
  sandboxEnvVars: Record<string, string>;
}> {
  const [credentials, sandboxEnvVars] = await Promise.all([
    resolveVercelCredentialsForRepo(ctx, repoId),
    resolveEnvVars(ctx, repoId),
  ]);
  return { credentials, sandboxEnvVars };
}

/**
 * Resolves the decrypted credential env vars for an entity owner's selected
 * provider account, used to override the shared team credential at launch.
 *
 * Explicit selections fail closed when the account is unavailable or does not
 * match the model. Silently falling back would attribute a turn to one account
 * while actually spending another account's quota.
 */
export async function resolveProviderAccountCredentials(
  ctx: GenericActionCtx<DataModel>,
  accountId: Id<"userProviderAccounts">,
  ownerUserId: Id<"users">,
  model: string | undefined,
): Promise<Record<string, string>> {
  const account = await ctx.runQuery(
    internal.userProviderAccounts.getForLaunchInternal,
    { accountId, ownerUserId },
  );
  if (!account) {
    throw new Error("Selected provider account is no longer available");
  }
  const modelProvider = getAIModelProvider(model);
  if (account.provider !== modelProvider) {
    throw new Error("Selected provider account does not support this model");
  }
  // Bookkeeping only — never let it break a launch that has its credentials.
  try {
    await ctx.runMutation(internal.userProviderAccounts.recordUsageInternal, {
      accountId,
      userId: ownerUserId,
    });
  } catch (error) {
    console.warn(
      `[env] resolveProviderAccountCredentials: could not record usage of account ${accountId}`,
      error,
    );
  }
  const resolved: Record<string, string> = {};
  for (const entry of account.credentials) {
    resolved[entry.key] = decryptValue(entry.value);
  }
  return resolved;
}

/**
 * Returns the credential revision used in a warm daemon's identity. Updating
 * credentials on the same account id therefore rotates the daemon too.
 */
export async function resolveProviderAccountCredentialRevision(
  ctx: GenericActionCtx<DataModel>,
  accountId: Id<"userProviderAccounts">,
  ownerUserId: Id<"users">,
  model: string | undefined,
): Promise<number> {
  const account = await ctx.runQuery(
    internal.userProviderAccounts.getForLaunchInternal,
    { accountId, ownerUserId },
  );
  if (!account) {
    throw new Error("Selected provider account is no longer available");
  }
  if (account.provider !== getAIModelProvider(model)) {
    throw new Error("Selected provider account does not support this model");
  }
  return account.updatedAt;
}
