import jwt from "jsonwebtoken";
import { z } from "zod";
import type { ConvexCredentials } from "./auth.js";

function getInternalSecret(): string {
  const secret = process.env.MCP_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("MCP_INTERNAL_SECRET environment variable is required");
  }
  return secret;
}

function getConvexUrl(): string {
  const convexUrl = process.env.CONVEX_CLOUD_URL;
  if (!convexUrl) {
    throw new Error("CONVEX_CLOUD_URL environment variable is required");
  }
  return convexUrl.replace(/\/$/, "");
}

const internalTokenPayloadSchema = z.object({
  sub: z.string(),
  iss: z.literal("eva"),
  aud: z.literal("mcp-internal"),
  repoId: z.string(),
});

export function verifyInternalToken(token: string): ConvexCredentials | null {
  try {
    const decoded = jwt.verify(token, getInternalSecret());
    const payload = internalTokenPayloadSchema.safeParse(decoded);
    if (!payload.success) return null;
    return {
      convexUrl: getConvexUrl(),
      clerkUserId: payload.data.sub,
      scopedRepoId: payload.data.repoId,
    };
  } catch {
    return null;
  }
}

const mintRequestSchema = z.object({
  clerkUserId: z.string(),
  repoId: z.string(),
});

export function mintInternalToken(
  body: Record<string, string>,
  bootstrapSecret: string,
): { token: string; expiresIn: number } | null {
  const expected = process.env.MCP_BOOTSTRAP_SECRET;
  if (!expected || bootstrapSecret !== expected) return null;

  const parsed = mintRequestSchema.safeParse(body);
  if (!parsed.success) return null;

  const expiresIn = 28800;
  const token = jwt.sign(
    {
      sub: parsed.data.clerkUserId,
      iss: "eva",
      aud: "mcp-internal",
      repoId: parsed.data.repoId,
    },
    getInternalSecret(),
    { expiresIn },
  );

  return { token, expiresIn };
}
