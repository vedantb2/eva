"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { getInstallationOctokit } from "./githubAuth";

export const createPullRequest = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (_ctx, args) => {
    try {
      const octokit = await getInstallationOctokit(args.installationId);
      const pr = await octokit.rest.pulls.create({
        owner: args.repoOwner,
        repo: args.repoName,
        title: `Eva: ${args.title}`,
        body: `## Task\n${args.description || "No description"}\n\n---\n*Implemented by Eva AI Agent*`,
        head: args.branchName,
        base: "main",
      });
      return pr.data.html_url;
    } catch (error) {
      console.error(
        `Failed to create PR: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  },
});
