import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type LegacyProjectJson = {
  id?: string;
};

function stripLegacyProjectIdField(
  project: Doc<"projects">,
): Omit<Doc<"projects">, "_id" | "_creationTime"> | null {
  const serialized = JSON.stringify(project);
  const parsed: Doc<"projects"> & LegacyProjectJson = JSON.parse(serialized);
  if (parsed.id === undefined) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    id: omittedLegacyId,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedLegacyId;
  return rest;
}

/**
 * Drops the stray `id` field that `projects.update` used to write into project
 * docs (it was left in the args rest-spread). That extra field breaks
 * projects:list return validation.
 *
 * Run once: `npx convex run migrations:removeProjectIdField`
 * Delete this function after it has run everywhere it was needed.
 */
export const removeProjectIdField = internalMutation({
  args: {},
  returns: v.object({ projectsPatched: v.number() }),
  handler: async (ctx) => {
    let projectsPatched = 0;
    const projects = await ctx.db.query("projects").collect();
    for (const project of projects) {
      const cleaned = stripLegacyProjectIdField(project);
      if (!cleaned) {
        continue;
      }
      await ctx.db.replace(project._id, cleaned);
      projectsPatched++;
    }
    console.log(
      `[migration] removeProjectIdField: patched ${projectsPatched} projects`,
    );
    return { projectsPatched };
  },
});
