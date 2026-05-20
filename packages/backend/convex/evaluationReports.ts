import { v } from "convex/values";
import { authQuery, hasRepoAccess } from "./functions";
import {
  evaluationStatusValidator,
  evalResultValidator,
  evalFixStatusValidator,
} from "./validators";

const reportValidator = v.object({
  _id: v.id("evaluationReports"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  docId: v.id("docs"),
  status: evaluationStatusValidator,
  results: v.array(evalResultValidator),
  summary: v.optional(v.string()),
  error: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  fixStatus: v.optional(evalFixStatusValidator),
  fixBranchName: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

/** Lists all evaluation reports for a document, sorted by most recent first. */
export const listByDoc = authQuery({
  args: { docId: v.id("docs") },
  returns: v.array(reportValidator),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId)))
      return [];
    const reports = await ctx.db
      .query("evaluationReports")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .collect();
    return reports.sort((a, b) => b.createdAt - a.createdAt);
  },
});
