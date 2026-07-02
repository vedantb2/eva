import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import {
  findSiblingRepos,
  pickDefaultVisibleAppRepo,
} from "../_githubRepos/helpers";

/** Checks whether PR recaps are enabled for a repo's codebase siblings. */
export const getRecapSiblingsGate = internalQuery({
  args: { repoId: v.string() },
  returns: v.union(
    v.object({
      workflowRepoId: v.id("githubRepos"),
      installationId: v.number(),
      owner: v.string(),
      name: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const repoId = ctx.db.normalizeId("githubRepos", args.repoId);
    if (!repoId) return null;

    const siblings = await findSiblingRepos(ctx.db, repoId);
    if (!siblings.some((repo) => repo.prRecapsEnabled === true)) {
      return null;
    }
    const workflowRepo =
      siblings.find((repo) => repo.rootDirectory === undefined) ?? siblings[0];
    if (!workflowRepo) return null;
    return {
      workflowRepoId: workflowRepo._id,
      installationId: workflowRepo.installationId,
      owner: workflowRepo.owner,
      name: workflowRepo.name,
    };
  },
});

/** Resolves repo + link metadata for publishing a recap from MCP. */
export const getPublishContext = internalQuery({
  args: { docId: v.id("docs") },
  returns: v.object({
    repoOwner: v.string(),
    repoName: v.string(),
    installationId: v.number(),
    prNumber: v.number(),
    linkRootDirectory: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || doc.kind !== "pr-recap" || doc.prNumber === undefined) {
      throw new Error("PR recap doc not found");
    }

    const siblings = await findSiblingRepos(ctx.db, doc.repoId);
    const workflowRepo =
      siblings.find((repo) => repo.rootDirectory === undefined) ?? siblings[0];
    if (!workflowRepo) {
      throw new Error("Repository not found");
    }

    const linkRepo = pickDefaultVisibleAppRepo(siblings);

    return {
      repoOwner: workflowRepo.owner,
      repoName: workflowRepo.name,
      installationId: workflowRepo.installationId,
      prNumber: doc.prNumber,
      linkRootDirectory: linkRepo?.rootDirectory,
    };
  },
});
