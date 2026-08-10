"use node";

import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import { action } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import {
  getInstallationOctokit,
  getInstallationToken,
} from "../githubAuth";
import { detectAppsForRepo } from "./helpers";
import { getActionRepoWithAccess } from "../functions";

const listAccessibleReposRef = makeFunctionReference<
  "query",
  { includeHidden?: boolean },
  Doc<"githubRepos">[]
>("githubRepos:list");

type InstallationAccessState = "unclaimed" | "owner" | "member" | "denied";

const installationAccessStateRef = makeFunctionReference<
  "query",
  { installationId: number },
  InstallationAccessState
>("githubRepos:getInstallationAccessState");

/** Returns a short-lived installation token for a given GitHub repo's app installation. */
export const getInstallationTokenAction = action({
  args: { repoId: v.id("githubRepos") },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const repo = await getActionRepoWithAccess(ctx, args.repoId);
    const token = await getInstallationToken(repo.installationId);
    return { token };
  },
});

/** Lists all branches for a given repository via the GitHub API. */
export const listBranches = action({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(v.object({ name: v.string(), protected: v.boolean() })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const repo = await getActionRepoWithAccess(ctx, args.repoId);
    const octokit = await getInstallationOctokit(repo.installationId);
    const allBranches = await octokit.paginate(
      octokit.rest.repos.listBranches,
      {
        owner: repo.owner,
        repo: repo.name,
        per_page: 100,
      },
    );
    return allBranches.map((b) => ({ name: b.name, protected: b.protected }));
  },
});

/** Lists all repositories accessible to a specific GitHub App installation. */
export const listRepos = action({
  args: { installationId: v.number() },
  returns: v.array(
    v.object({
      id: v.number(),
      name: v.string(),
      fullName: v.string(),
      owner: v.string(),
      private: v.boolean(),
      url: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const accessState = await ctx.runQuery(
      installationAccessStateRef,
      { installationId: args.installationId },
    );
    if (accessState !== "owner" && accessState !== "unclaimed") {
      throw new Error("Not authorized to inspect this installation");
    }
    const octokit = await getInstallationOctokit(args.installationId);
    const repos = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });
    return repos.data.repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      url: repo.html_url,
    }));
  },
});

/** Detects monorepo sub-applications in a repository's apps/ directory. */
export const detectMonorepoApps = action({
  args: {
    installationId: v.number(),
    owner: v.string(),
    name: v.string(),
  },
  returns: v.array(
    v.object({
      name: v.string(),
      path: v.string(),
      hasDevScript: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const accessState = await ctx.runQuery(
      installationAccessStateRef,
      { installationId: args.installationId },
    );
    if (accessState !== "owner" && accessState !== "unclaimed") {
      throw new Error("Not authorized to inspect this installation");
    }
    const octokit = await getInstallationOctokit(args.installationId);
    return detectAppsForRepo(octokit, args.owner, args.name);
  },
});

/** Lists only repository rows the current Eva user can already access. */
export const listAllAvailableRepos = action({
  args: {},
  returns: v.array(
    v.object({
      owner: v.string(),
      name: v.string(),
      githubId: v.number(),
      private: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const repos = await ctx.runQuery(listAccessibleReposRef, {
      includeHidden: true,
    });
    const seen = new Set<number>();
    return repos.flatMap((repo) => {
      if (repo.githubId === undefined || seen.has(repo.githubId)) return [];
      seen.add(repo.githubId);
      return [
        {
          owner: repo.owner,
          name: repo.name,
          githubId: repo.githubId,
          private: true,
        },
      ];
    });
  },
});
