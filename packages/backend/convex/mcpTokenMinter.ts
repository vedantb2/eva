"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const RETRYABLE_MCP_STATUS_CODES = new Set([429, 502, 503, 504]);
const MCP_MINT_MAX_ATTEMPTS = 3;

function getMcpBaseUrl(): string {
  const url = process.env.MCP_BASE_URL;
  if (!url) throw new Error("MCP_BASE_URL environment variable is required");
  return url.replace(/\/$/, "");
}

function getMcpBootstrapSecret(): string {
  const secret = process.env.MCP_BOOTSTRAP_SECRET;
  if (!secret)
    throw new Error("MCP_BOOTSTRAP_SECRET environment variable is required");
  return secret;
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildRetryDelayMs(attempt: number): number {
  return attempt * 2000 + Math.floor(Math.random() * 500);
}

export const mintSandboxMcpToken = internalAction({
  args: {
    userId: v.id("users"),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({ token: v.string(), expiresIn: v.number() }),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getInternal, {
      userId: args.userId,
    });
    if (!user) throw new Error("User not found");

    for (let attempt = 1; attempt <= MCP_MINT_MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch(
          `${getMcpBaseUrl()}/api/internal/mint-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `MCPBootstrap ${getMcpBootstrapSecret()}`,
            },
            body: JSON.stringify({
              clerkUserId: user.clerkId,
              repoId: String(args.repoId),
            }),
          },
        );

        if (!response.ok) {
          if (
            attempt < MCP_MINT_MAX_ATTEMPTS &&
            RETRYABLE_MCP_STATUS_CODES.has(response.status)
          ) {
            await delay(buildRetryDelayMs(attempt));
            continue;
          }
          throw new Error(`Failed to mint MCP token: HTTP ${response.status}`);
        }

        const result: { token: string; expiresIn: number } =
          await response.json();
        return { token: result.token, expiresIn: result.expiresIn };
      } catch (error) {
        if (attempt >= MCP_MINT_MAX_ATTEMPTS) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error(`Failed to mint MCP token: ${String(error)}`);
        }
        await delay(buildRetryDelayMs(attempt));
      }
    }

    throw new Error("Failed to mint MCP token");
  },
});
