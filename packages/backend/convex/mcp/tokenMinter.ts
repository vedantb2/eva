import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Mints an MCP authentication token for a sandbox user.
 *
 * The MCP server lives on the same Convex deployment, so we delegate to the
 * JWT-signing internal action directly instead of going through an HTTP
 * roundtrip back into our own deployment.
 */
export const mintSandboxMcpToken = internalAction({
  args: {
    userId: v.id("users"),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({ token: v.string(), expiresIn: v.number() }),
  handler: async (ctx, args): Promise<{ token: string; expiresIn: number }> => {
    const user = await ctx.runQuery(internal.users.getInternal, {
      userId: args.userId,
    });
    if (!user) throw new Error("User not found");

    const result = await ctx.runAction(
      internal.mcp.nodeActions.mintInternalToken,
      {
        clerkUserId: user.clerkId,
        repoId: String(args.repoId),
      },
    );
    if (!result) throw new Error("Failed to mint MCP token");
    return result;
  },
});
