import { v } from "convex/values";
import { authMutation, authQuery, hasRepoAccess } from "./functions";
import {
  aiModelValidator,
  cursorAdvertisedModeValidator,
  cursorAdvertisedModelValidator,
  cursorCapabilityConfigOptionValidator,
  getAIModelProvider,
  normalizeAIModel,
  providerComposerCapabilityValidator,
} from "./validators";
import {
  cursorComposerCapabilities,
  cursorModelIdForEva,
  evaModelIdsForCursor,
} from "../cursorCapabilities";
import type { Doc, Id } from "./_generated/dataModel";

const CAPABILITY_TTL_MS = 6 * 60 * 60 * 1000;

function capabilityScopeKey(
  repoId: Id<"githubRepos">,
  providerAccountId: Id<"userProviderAccounts"> | undefined,
): string {
  return providerAccountId
    ? `cursor:account:${providerAccountId}`
    : `cursor:repo:${repoId}:team`;
}

async function validateCursorAccount(
  ctx: Parameters<typeof hasRepoAccess>[0],
  providerAccountId: Id<"userProviderAccounts"> | undefined,
): Promise<boolean> {
  if (providerAccountId === undefined) return true;
  const account = await ctx.get(providerAccountId);
  return account?.provider === "cursor";
}

/** Records a sanitized Cursor ACP capability snapshot from an authenticated sandbox. */
export const recordCursor = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    cliVersion: v.string(),
    models: v.array(cursorAdvertisedModelValidator),
    sessionConfigOptions: v.array(cursorCapabilityConfigOptionValidator),
    availableModes: v.array(cursorAdvertisedModeValidator),
  },
  returns: v.object({ cached: v.boolean() }),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (!(await validateCursorAccount(ctx.db, args.providerAccountId))) {
      throw new Error("Cursor provider account not found");
    }

    const scopeKey = capabilityScopeKey(args.repoId, args.providerAccountId);
    const existing = await ctx.db
      .query("providerCapabilitySnapshots")
      .withIndex("by_scope_and_cli", (query) =>
        query.eq("scopeKey", scopeKey).eq("cliVersion", args.cliVersion),
      )
      .first();
    const now = Date.now();
    if (existing && existing.expiresAt > now) {
      return { cached: true };
    }

    const snapshot: Omit<
      Doc<"providerCapabilitySnapshots">,
      "_id" | "_creationTime"
    > = {
      provider: "cursor",
      repoId: args.repoId,
      providerAccountId: args.providerAccountId,
      scopeKey,
      cliVersion: args.cliVersion,
      models: args.models,
      sessionConfigOptions: args.sessionConfigOptions,
      availableModes: args.availableModes,
      fetchedAt: now,
      expiresAt: now + CAPABILITY_TTL_MS,
    };
    if (existing) {
      await ctx.db.replace(existing._id, snapshot);
    } else {
      await ctx.db.insert("providerCapabilitySnapshots", snapshot);
    }
    return { cached: false };
  },
});

const cursorCapabilitiesResultValidator = v.object({
  cliVersion: v.string(),
  fetchedAt: v.number(),
  availableModels: v.array(aiModelValidator),
  controls: v.array(providerComposerCapabilityValidator),
  availableModes: v.array(cursorAdvertisedModeValidator),
});

/** Latest unexpired Cursor capabilities for the exact team/personal account scope. */
export const getCursor = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    model: v.optional(aiModelValidator),
    now: v.number(),
  },
  returns: v.union(v.null(), cursorCapabilitiesResultValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return null;
    if (!(await validateCursorAccount(ctx.db, args.providerAccountId))) {
      return null;
    }
    const scopeKey = capabilityScopeKey(args.repoId, args.providerAccountId);
    const snapshot = await ctx.db
      .query("providerCapabilitySnapshots")
      .withIndex("by_scope_and_fetched", (query) =>
        query.eq("scopeKey", scopeKey),
      )
      .order("desc")
      .first();
    if (!snapshot || snapshot.expiresAt <= args.now) return null;

    const availableModels = [
      ...new Set(
        snapshot.models.flatMap((model) => evaModelIdsForCursor(model.value)),
      ),
    ];
    const normalizedModel = normalizeAIModel(args.model);
    const rawModelId = cursorModelIdForEva(normalizedModel);
    const advertisedModel = snapshot.models.find(
      (model) =>
        model.value === rawModelId ||
        evaModelIdsForCursor(model.value).some(
          (candidate) => candidate === normalizedModel,
        ),
    );
    const controls =
      getAIModelProvider(normalizedModel) === "cursor"
        ? cursorComposerCapabilities(
            advertisedModel?.configOptions ?? snapshot.sessionConfigOptions,
          )
        : [];
    return {
      cliVersion: snapshot.cliVersion,
      fetchedAt: snapshot.fetchedAt,
      availableModels,
      controls,
      availableModes: snapshot.availableModes,
    };
  },
});
