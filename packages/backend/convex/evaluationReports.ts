import { v } from "convex/values";
import { authQuery, hasRepoAccess } from "./functions";
import { evaluationReportFields } from "./validators";

const reportValidator = v.object({
  _id: v.id("evaluationReports"),
  _creationTime: v.number(),
  ...evaluationReportFields,
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
