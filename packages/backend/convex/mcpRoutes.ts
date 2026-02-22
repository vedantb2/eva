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
    const vars: Array<{ key: string; value: string }> = await ctx.runQuery(
      internal.repoEnvVars.getForSandbox,
      { repoId: args.repoId },
    );
    return vars.map((entry) => ({
      key: entry.key,
      value: decryptValue(entry.value),
    }));
  },
});
