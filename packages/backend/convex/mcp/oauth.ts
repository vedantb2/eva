import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

/**
 * Store an OAuth authorization code.
 * Called after Clerk authentication to generate a code for the token exchange.
 */
export const storeAuthCode = internalMutation({
  args: {
    code: v.string(),
    clerkUserId: v.string(),
    codeChallenge: v.string(),
    codeChallengeMethod: v.string(),
    redirectUri: v.string(),
    clientId: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("mcpAuthCodes", args);
  },
});

/**
 * Consume an authorization code (retrieve + delete atomically).
 * Returns the code entry if found and not expired, null otherwise.
 */
export const consumeAuthCode = internalMutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const entry = await ctx.db
      .query("mcpAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!entry) return null;

    // Delete the code regardless of expiry (cleanup)
    await ctx.db.delete(entry._id);

    // Return null if expired
    if (entry.expiresAt < Date.now()) return null;

    return {
      clerkUserId: entry.clerkUserId,
      codeChallenge: entry.codeChallenge,
      codeChallengeMethod: entry.codeChallengeMethod,
      redirectUri: entry.redirectUri,
      clientId: entry.clientId,
    };
  },
});

/**
 * Register a new OAuth client.
 * Called during dynamic client registration.
 */
export const registerClient = internalMutation({
  args: {
    clientId: v.string(),
    clientSecret: v.optional(v.string()),
    redirectUris: v.array(v.string()),
  },
  handler: async (ctx, { clientId, clientSecret, redirectUris }) => {
    await ctx.db.insert("mcpClientRegistrations", {
      clientId,
      clientSecret,
      redirectUris,
      registeredAt: Date.now(),
    });
  },
});

/**
 * Get an OAuth client by client_id.
 * Returns null if not found or expired (24h TTL).
 */
export const getClient = internalQuery({
  args: { clientId: v.string() },
  handler: async (ctx, { clientId }) => {
    const client = await ctx.db
      .query("mcpClientRegistrations")
      .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
      .first();

    if (!client) return null;

    // 24h TTL for client registrations
    const CLIENT_TTL_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - client.registeredAt > CLIENT_TTL_MS) {
      return null;
    }

    return {
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      redirectUris: client.redirectUris,
      registeredAt: client.registeredAt,
    };
  },
});

/**
 * Cleanup expired auth codes and client registrations.
 * Can be called periodically via cron or manually.
 */
export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const CLIENT_TTL_MS = 24 * 60 * 60 * 1000;

    // Cleanup expired auth codes
    const expiredCodes = await ctx.db
      .query("mcpAuthCodes")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const code of expiredCodes) {
      await ctx.db.delete(code._id);
    }

    // Cleanup expired client registrations
    const expiredClients = await ctx.db
      .query("mcpClientRegistrations")
      .filter((q) => q.lt(q.field("registeredAt"), now - CLIENT_TTL_MS))
      .collect();

    for (const client of expiredClients) {
      await ctx.db.delete(client._id);
    }

    return {
      deletedCodes: expiredCodes.length,
      deletedClients: expiredClients.length,
    };
  },
});
