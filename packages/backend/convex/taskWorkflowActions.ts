"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const createPullRequest = internalAction({
  args: {
    githubToken: v.string(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (_ctx, args) => {
    const res = await fetch(
      `https://api.github.com/repos/${args.repoOwner}/${args.repoName}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${args.githubToken}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          title: args.title,
          body: `## Task\n${args.description || "No description"}\n\n---\n*Implemented by Eva AI Agent*`,
          head: args.branchName,
          base: "main",
        }),
      },
    );
    if (!res.ok) {
      console.error(`Failed to create PR: ${await res.text()}`);
      return null;
    }
    const pr: { html_url: string } = await res.json();
    return pr.html_url;
  },
});
