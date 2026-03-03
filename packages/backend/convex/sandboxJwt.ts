"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { importJWK, SignJWT } from "jose";

export const signSandboxToken = internalAction({
  args: { userId: v.id("users") },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const clerkId = await ctx.runQuery(internal.auth.getUserClerkId, {
      userId: args.userId,
    });
    if (!clerkId) {
      throw new Error("User has no clerkId");
    }

    const privateKeyJson = process.env.SANDBOX_JWT_PRIVATE_KEY;
    if (!privateKeyJson) {
      throw new Error("Missing SANDBOX_JWT_PRIVATE_KEY env var");
    }

    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) {
      throw new Error("Missing CONVEX_SITE_URL env var");
    }

    const privateKeyJwk: Record<string, unknown> = JSON.parse(privateKeyJson);
    const kid =
      typeof privateKeyJwk.kid === "string" ? privateKeyJwk.kid : "sandbox-1";
    const key = await importJWK(privateKeyJwk, "ES256");

    const jwt = await new SignJWT({ sub: clerkId })
      .setProtectedHeader({ alg: "ES256", kid })
      .setIssuer(siteUrl)
      .setAudience("convex")
      .setExpirationTime("24h")
      .setIssuedAt()
      .sign(key);

    return jwt;
  },
});
