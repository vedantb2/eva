import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/** Upserts the credential row for a sandbox, replacing any prior secret. */
export const upsertForSandbox = internalMutation({
  args: {
    sandboxId: v.string(),
    installationId: v.number(),
    // Every installation the sandbox may mint a token for, primary included.
    // Absent (or primary-only) for an ordinary single-repo session.
    installationIds: v.optional(v.array(v.number())),
    secret: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sandboxGitCredentials")
      .withIndex("by_sandbox_id", (q) => q.eq("sandboxId", args.sandboxId))
      .unique();
    // Union, never replace. `ensureGitCredentialHelper` re-runs on every
    // resume knowing only the primary installation, and once per linked repo
    // knowing only that one — replacing here dropped a multi-repo session's
    // other installations and `/api/git-credentials` then 403'd their pushes.
    // A sandbox only ever serves one session, so the union can only ever hold
    // that session's own repos.
    const merged = Array.from(
      new Set([
        ...(existing?.installationIds ?? []),
        ...(args.installationIds ?? []),
        args.installationId,
      ]),
    );
    // Single-repo sessions keep the field absent, as before multi-repo:
    // `allowedInstallationIds` falls back to the scalar `installationId`.
    const installationIds = merged.length > 1 ? merged : undefined;
    if (existing) {
      await ctx.db.patch(existing._id, {
        installationId: args.installationId,
        installationIds,
        secret: args.secret,
        createdAt: Date.now(),
      });
      return null;
    }
    await ctx.db.insert("sandboxGitCredentials", {
      sandboxId: args.sandboxId,
      installationId: args.installationId,
      installationIds,
      secret: args.secret,
      createdAt: Date.now(),
    });
    return null;
  },
});

/** Returns the installations bound to a given bearer secret, or null. */
export const lookupCredentialBySecret = internalQuery({
  args: { secret: v.string() },
  returns: v.union(
    v.object({
      installationId: v.number(),
      installationIds: v.optional(v.array(v.number())),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("sandboxGitCredentials")
      .withIndex("by_secret", (q) => q.eq("secret", args.secret))
      .unique();
    return row
      ? { installationId: row.installationId, installationIds: row.installationIds }
      : null;
  },
});

/** Removes the credential row for a sandbox (best-effort cleanup on delete). */
export const deleteBySandboxId = internalMutation({
  args: { sandboxId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sandboxGitCredentials")
      .withIndex("by_sandbox_id", (q) => q.eq("sandboxId", args.sandboxId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});
