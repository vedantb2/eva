import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Resolves the signed-in user's row id from the Clerk identity, or null.
 *
 * Lives in its own leaf module (not auth.ts) on purpose: auth.ts builds its
 * queries with authQuery/authMutation from functions.ts, so functions.ts
 * importing this helper from auth.ts formed a module cycle. The isolate
 * bundle tolerated it, but the "use node" action bundle evaluated auth.ts
 * first and crashed Convex's deploy analysis with "d is not a function"
 * (authQuery still uninitialized).
 */
export async function getCurrentUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const clerkUserId = identity.subject;
  if (!clerkUserId) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUserId))
    .first();

  return user?._id ?? null;
}
