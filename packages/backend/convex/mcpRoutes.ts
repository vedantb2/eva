"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { decryptValue } from "./encryption";
import type { Id } from "./_generated/dataModel";

function isRepoId(id: string): id is Id<"githubRepos"> {
  return id.length > 0 && !/\s/.test(id);
}

export const getDecryptedRepoEnvVars = internalAction({
  args: { repoId: v.string() },
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (
    ctx,
    args,
  ): Promise<Array<{ key: string; value: string }>> => {
    if (!isRepoId(args.repoId)) {
      return [];
    }

    const teamId = await ctx.runQuery(internal.githubRepos.getTeamIdForRepo, {
      repoId: args.repoId,
    });

    const teamEnvVars: Record<string, string> = {};
    if (teamId) {
      const vars = await ctx.runQuery(internal.teamEnvVars.getForSandbox, {
        teamId,
      });
      for (const v of vars) {
        teamEnvVars[v.key] = decryptValue(v.value);
      }
    }

    const repoVars: Array<{ key: string; value: string }> = await ctx.runQuery(
      internal.repoEnvVars.getForSandbox,
      { repoId: args.repoId },
    );

    const repoEnvVars: Record<string, string> = {};
    for (const entry of repoVars) {
      repoEnvVars[entry.key] = decryptValue(entry.value);
    }

    const merged = { ...teamEnvVars, ...repoEnvVars };
    return Object.entries(merged).map(([key, value]) => ({ key, value }));
  },
});
