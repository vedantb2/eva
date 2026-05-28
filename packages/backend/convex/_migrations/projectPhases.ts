import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
/** Maps legacy `active` project phase to the new lifecycle phases. */
export const migrateProjectPhases = internalMutation({
  args: {},
  returns: v.object({ projectsUpdated: v.number() }),
  handler: async (ctx) => {
    let projectsUpdated = 0;
    const projects = await ctx.db.query("projects").collect();

    for (const project of projects) {
      if (project.phase !== "active") continue;

      const projectId = project._id;
      const hasBuilding = await ctx.db
        .query("agentTasks")
        .withIndex("by_project_and_status", (q) =>
          q.eq("projectId", projectId).eq("status", "todo"),
        )
        .first();
      const hasInProgress = await ctx.db
        .query("agentTasks")
        .withIndex("by_project_and_status", (q) =>
          q.eq("projectId", projectId).eq("status", "in_progress"),
        )
        .first();
      const hasCodeReview = await ctx.db
        .query("agentTasks")
        .withIndex("by_project_and_status", (q) =>
          q.eq("projectId", projectId).eq("status", "code_review"),
        )
        .first();

      let nextPhase: "in_progress" | "business_review" | "code_review" =
        "business_review";
      if (hasBuilding || hasInProgress) {
        nextPhase = "in_progress";
      } else if (hasCodeReview) {
        nextPhase = "code_review";
      }

      await ctx.db.patch(projectId, { phase: nextPhase });
      projectsUpdated++;
    }

    console.log(
      `[migration] migrateProjectPhases: updated ${projectsUpdated} projects`,
    );
    return { projectsUpdated };
  },
});
