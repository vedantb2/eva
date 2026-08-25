import { v } from "convex/values";
import { authMutation, authQuery, hasRepoAccess } from "./functions";
import { internalQuery } from "./_generated/server";
import {
  agentUsageLimitFields,
  usageLimitProviderValidator,
} from "./validators";
import type { Doc } from "./_generated/dataModel";
import { isAccountUsableBy } from "./_userProviderAccounts/sharing";

/**
 * Agent plan usage limits. A sandbox turn captures how much of the provider's
 * plan it has used and reports it here; the UI reads it back per repo.
 *
 * Deliberately its own mutation rather than extra completion arguments: the
 * completion mutation is shared by every entity workflow, and a reading that is
 * pure telemetry has no business widening that contract.
 *
 * Auth mirrors the completion mutations — the sandbox calls in with its
 * CONVEX_TOKEN identity (the launching user), so repo access is checked exactly
 * as `sessionWorkflow:handleCompletion` checks it.
 */

const agentUsageLimitValidator = v.object({
  _id: v.id("agentUsageLimits"),
  _creationTime: v.number(),
  ...agentUsageLimitFields,
  /**
   * The account's current name, resolved on read rather than stored, so a
   * rename shows up without rewriting rows. Absent when the run used the shared
   * team credential, or when the account has since been deleted.
   */
  accountLabel: v.optional(v.string()),
});

/**
 * Upserts the reading for one (repo, provider, account) triple. Authoritative
 * provider snapshots replace the row so vanished windows are cleared; partial
 * stream observations patch only what they actually observed.
 *
 * The account is part of the key because plan limits are per account — keyed on
 * the provider alone, a second connected account's reading would overwrite the
 * first. A run on the shared team credential reports no account and keeps its
 * own row.
 */
type UsageWindow = NonNullable<Doc<"agentUsageLimits">["windows"]>[number];

/** Readings older than this are no longer evidence of the provider's state. */
export const USAGE_LIMIT_READING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** New same-key windows win while unobserved stored windows remain intact. */
export function mergeUsageLimitWindows(
  stored: readonly UsageWindow[] | undefined,
  reported: readonly UsageWindow[] | undefined,
): UsageWindow[] | undefined {
  if (reported === undefined) return stored ? [...stored] : undefined;
  const byKey = new Map((stored ?? []).map((window) => [window.key, window]));
  for (const window of reported) byKey.set(window.key, window);
  return [...byKey.values()];
}

export function isUsageLimitReadingFresh(
  capturedAt: number,
  now: number,
): boolean {
  return now - capturedAt <= USAGE_LIMIT_READING_MAX_AGE_MS;
}

export const report = authMutation({
  args: {
    ...agentUsageLimitFields,
    /** True only after an authoritative provider `/usage` response. Older
     * callback bundles omit it and therefore safely receive merge semantics. */
    snapshotComplete: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (args.providerAccountId) {
      const account = await ctx.db.get(args.providerAccountId);
      if (
        !account ||
        account.provider !== args.provider ||
        !(await isAccountUsableBy(ctx.db, account, ctx.userId))
      ) {
        throw new Error("Provider account not found");
      }
    }
    const existing = await ctx.db
      .query("agentUsageLimits")
      .withIndex("by_repo_provider_account", (q) =>
        q
          .eq("repoId", args.repoId)
          .eq("provider", args.provider)
          .eq("providerAccountId", args.providerAccountId),
      )
      .first();
    const { snapshotComplete, ...reading } = args;
    if (existing) {
      if (snapshotComplete === true) {
        await ctx.db.replace(existing._id, reading);
        return null;
      }
      // A partial report that observed nothing is not evidence of anything —
      // re-stamping `capturedAt` for it would keep presenting hours-old numbers
      // as "updated 1m ago" forever. Only a report that actually carries a
      // reading moves the clock.
      const carriesReading =
        reading.windows !== undefined ||
        reading.status !== undefined ||
        reading.subscriptionType !== undefined;
      if (!carriesReading) return null;
      await ctx.db.patch(existing._id, {
        capturedAt: reading.capturedAt,
        ...(reading.subscriptionType === undefined
          ? {}
          : { subscriptionType: reading.subscriptionType }),
        ...(reading.status === undefined ? {} : { status: reading.status }),
        ...(reading.windows === undefined
          ? {}
          : {
              windows: mergeUsageLimitWindows(
                existing.windows,
                reading.windows,
              ),
            }),
      });
      return null;
    }
    await ctx.db.insert("agentUsageLimits", reading);
    return null;
  },
});

/**
 * The stored row for one (repo, provider, account) triple, for the refresh
 * action. `/usage` reports windows but never names the plan, and an
 * authoritative refresh replaces the row — so the plan name has to be read back
 * and re-sent, or a refresh would silently drop "Max plan" from the heading.
 * Internal only; the action has already checked repo access.
 */
export const getReadingInternal = internalQuery({
  args: {
    repoId: v.id("githubRepos"),
    provider: usageLimitProviderValidator,
    providerAccountId: v.optional(v.id("userProviderAccounts")),
  },
  returns: v.union(
    v.null(),
    v.object({ subscriptionType: v.optional(v.string()) }),
  ),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentUsageLimits")
      .withIndex("by_repo_provider_account", (q) =>
        q
          .eq("repoId", args.repoId)
          .eq("provider", args.provider)
          .eq("providerAccountId", args.providerAccountId),
      )
      .first();
    if (!existing) return null;
    return existing.subscriptionType === undefined
      ? {}
      : { subscriptionType: existing.subscriptionType };
  },
});

/**
 * Every account's latest reading for a repo, most recently captured first. One
 * provider can appear more than once — once per connected account it has run on.
 *
 * A row belonging to a provider account the caller may not run on is omitted
 * entirely, not merely stripped of its label: plan headroom is a fact about
 * somebody else's account. Rows with no account (the shared team credential)
 * are visible to everyone with repo access.
 */
export const getByRepo = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    /** Quantized by the caller so expiry remains deterministic and cacheable. */
    now: v.number(),
  },
  returns: v.array(agentUsageLimitValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const rows = await ctx.db
      .query("agentUsageLimits")
      .withIndex("by_repo_provider_account", (q) => q.eq("repoId", args.repoId))
      .collect();
    const visible = [];
    for (const row of rows) {
      if (!isUsageLimitReadingFresh(row.capturedAt, args.now)) continue;
      const next = { ...row };
      const reportedWindows = next.windows;
      if (reportedWindows) {
        const activeWindows = reportedWindows.filter(
          (window) =>
            window.resetsAt === undefined || window.resetsAt > args.now,
        );
        if (activeWindows.length > 0) {
          next.windows = activeWindows;
        } else {
          delete next.windows;
          // A status observed alongside windows expires when all of those
          // windows reset. Windowless status-only events remain until the row's
          // captured-at freshness limit above.
          if (reportedWindows.length > 0) delete next.status;
        }
      }
      // A row with no account ran on the shared team credential and belongs to
      // no one in particular, so anyone with repo access may see it.
      const accountId = next.providerAccountId;
      const account =
        accountId === undefined ? null : await ctx.db.get(accountId);
      const canSeeAccount =
        account !== null &&
        account.provider === next.provider &&
        (await isAccountUsableBy(ctx.db, account, ctx.userId));
      // An account the caller cannot run on is one whose plan headroom is none
      // of their business, so the row is dropped rather than anonymised.
      if (accountId !== undefined && !canSeeAccount) continue;
      visible.push({
        ...next,
        ...(canSeeAccount && account ? { accountLabel: account.label } : {}),
      });
    }
    visible.sort((a, b) => b.capturedAt - a.capturedAt);
    return visible;
  },
});
