"use node";

import { v, type Infer } from "convex/values";
import { api, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authAction, getActionRepoWithAccess } from "./functions";
import {
  PROVIDER_PRIMARY_AUTH_KEY,
  usageLimitProviderValidator,
} from "./validators";
import { decryptValue } from "./encryption";
import { resolveAllEnvVars } from "./envVarResolver";
import {
  claudeUsageBodySchema,
  hasPlanRateLimits,
  readClaudeUsageWindows,
  type ClaudeUsageBody,
  type UsageWindow,
} from "./_usageLimits/claudeUsage";

/**
 * Pulling a plan-usage reading on demand, rather than waiting for the next turn
 * to report one. The card's refresh button calls this; everything else about
 * the feature still arrives from the sandbox.
 *
 * The reading is always taken with the credential the caller's surface is
 * scoped to — a connected account, or the shared team credential — and never
 * falls back from one to the other, because the whole point of the row is
 * whose plan it measures.
 */

const CLAUDE_USAGE_URL = "https://api.anthropic.com/api/oauth/usage";
const USAGE_TIMEOUT_MS = 8_000;
/** Required by the undocumented OAuth usage endpoint. */
const CLAUDE_USAGE_BETA = "oauth-2025-04-20";
/**
 * The endpoint rate-limits by User-Agent. Node/undici's default (and a missing
 * UA) land in a bucket that 429s immediately; Claude Code's identifier is the
 * one the endpoint actually serves.
 */
const CLAUDE_USAGE_USER_AGENT = "claude-code/2.1.72";

type UsageProvider = Infer<typeof usageLimitProviderValidator>;

/** Why a refresh produced nothing, in the vocabulary the toast copy speaks. */
type RefreshFailure =
  | "no-token"
  | "unauthorized"
  | "network"
  | "unavailable"
  | "rate-limited";

type TokenLookup = { kind: "token"; token: string } | { kind: "missing" };

type UsageFetch =
  | { kind: "body"; body: ClaudeUsageBody }
  | { kind: "unauthorized" }
  | { kind: "network" }
  | { kind: "rate-limited" };

/**
 * The token for the account the refresh is scoped to. Throws when the account
 * is not one the caller may run on — a refresh on somebody else's credential is
 * not a degraded case to fall back from, it is a request that should not have
 * been made.
 */
async function accountToken(
  ctx: ActionCtx,
  accountId: Id<"userProviderAccounts">,
  provider: UsageProvider,
  userId: Id<"users">,
): Promise<TokenLookup> {
  const account = await ctx.runQuery(
    internal.userProviderAccounts.getForLaunchInternal,
    { accountId, ownerUserId: userId },
  );
  if (account === null || account.provider !== provider) {
    throw new Error("Provider account not found");
  }
  const entry = account.credentials.find(
    (credential) => credential.key === PROVIDER_PRIMARY_AUTH_KEY[provider],
  );
  if (entry === undefined) return { kind: "missing" };
  return { kind: "token", token: decryptValue(entry.value) };
}

/** The shared team credential, from the same env vars a launch would inject. */
async function teamToken(
  ctx: ActionCtx,
  repoId: Id<"githubRepos">,
  provider: UsageProvider,
): Promise<TokenLookup> {
  const envVars = await resolveAllEnvVars(ctx, repoId);
  const token = envVars[PROVIDER_PRIMARY_AUTH_KEY[provider]];
  if (token === undefined || token.length === 0) return { kind: "missing" };
  return { kind: "token", token };
}

/**
 * The body as a usage report, or null when the response was not JSON or did not
 * match the shape at all. The endpoint is undocumented, so a body that parses
 * is still only a candidate — see `hasPlanRateLimits`.
 */
async function readUsageBody(
  response: Response,
): Promise<ClaudeUsageBody | null> {
  const parsed = claudeUsageBodySchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!parsed.success) return null;
  return parsed.data;
}

async function fetchClaudeUsage(token: string): Promise<UsageFetch> {
  const response = await fetch(CLAUDE_USAGE_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "anthropic-beta": CLAUDE_USAGE_BETA,
      "User-Agent": CLAUDE_USAGE_USER_AGENT,
    },
    signal: AbortSignal.timeout(USAGE_TIMEOUT_MS),
  }).catch((error: Error) => {
    console.warn("[usageLimits] Claude usage request failed", error.message);
    return null;
  });
  if (response === null) return { kind: "network" };
  // A rejected token is the one failure worth naming to the user: it is fixed
  // by reconnecting the account, not by trying again.
  if (response.status === 401 || response.status === 403) {
    return { kind: "unauthorized" };
  }
  if (response.status === 429) {
    console.warn("[usageLimits] Claude usage returned 429");
    return { kind: "rate-limited" };
  }
  if (!response.ok) {
    console.warn(`[usageLimits] Claude usage returned ${response.status}`);
    return { kind: "network" };
  }
  const body = await readUsageBody(response);
  if (body === null) {
    console.warn("[usageLimits] Claude usage body did not parse");
    return { kind: "network" };
  }
  return { kind: "body", body };
}

/**
 * Reads the provider's plan usage now and stores it as an authoritative
 * snapshot, so a card opened long after the last turn can be brought up to date
 * without running one.
 *
 * No status is reported: `/usage` returns numbers, not a verdict on whether the
 * plan would accept work, and the snapshot replaces the row — which is how a
 * stale "rejected" from an old turn gets cleared.
 */
export const refresh = authAction({
  args: {
    repoId: v.id("githubRepos"),
    provider: usageLimitProviderValidator,
    providerAccountId: v.optional(v.id("userProviderAccounts")),
  },
  returns: v.object({ ok: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: boolean; reason?: RefreshFailure }> => {
    await getActionRepoWithAccess(ctx, args.repoId);
    const accountId = args.providerAccountId;
    // A refresh is not a launch: the account's `lastUsedAt` stays where the
    // last real turn left it.
    const lookup =
      accountId === undefined
        ? await teamToken(ctx, args.repoId, args.provider)
        : await accountToken(ctx, accountId, args.provider, ctx.userId);
    if (lookup.kind === "missing") return { ok: false, reason: "no-token" };

    const result = await fetchClaudeUsage(lookup.token);
    if (result.kind === "unauthorized") {
      return { ok: false, reason: "unauthorized" };
    }
    if (result.kind === "rate-limited") {
      return { ok: false, reason: "rate-limited" };
    }
    if (result.kind === "network") return { ok: false, reason: "network" };
    // An HTTP 200 error envelope parses cleanly against an all-optional shape,
    // so reporting no rate limits at all is treated as no reading — writing it
    // would replace a good row with an empty one.
    if (!hasPlanRateLimits(result.body)) {
      return { ok: false, reason: "unavailable" };
    }

    const windows: UsageWindow[] = readClaudeUsageWindows(result.body);
    const accountArg =
      accountId === undefined ? {} : { providerAccountId: accountId };
    // `/usage` never names the plan, and this snapshot replaces the row, so the
    // stored plan name is carried forward rather than dropped.
    const stored = await ctx.runQuery(internal.usageLimits.getReadingInternal, {
      repoId: args.repoId,
      provider: args.provider,
      ...accountArg,
    });
    const subscriptionType = stored?.subscriptionType;
    await ctx.runMutation(api.usageLimits.report, {
      repoId: args.repoId,
      provider: args.provider,
      ...accountArg,
      capturedAt: Date.now(),
      snapshotComplete: true,
      completeness: "complete",
      windows,
      ...(subscriptionType === undefined ? {} : { subscriptionType }),
    });
    return { ok: true };
  },
});
