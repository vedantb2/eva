import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type LegacyRepoJson = {
  screenshotsVideosEnabled?: boolean;
};

function stripLegacyRepoField(
  repo: Doc<"githubRepos">,
): Omit<Doc<"githubRepos">, "_id" | "_creationTime"> | null {
  const parsed: Doc<"githubRepos"> & LegacyRepoJson = JSON.parse(
    JSON.stringify(repo),
  );
  if (parsed.screenshotsVideosEnabled === undefined) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    screenshotsVideosEnabled: omittedField,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedField;
  return rest;
}

/**
 * Drops the deprecated `screenshotsVideosEnabled` field from githubRepos docs.
 * Proof capture is now opt-in per task/project (and per session/sandbox chat),
 * so the repo-level default no longer exists. Run this everywhere BEFORE the
 * field is removed from `githubRepoFields`, otherwise the schema push fails
 * validation on docs that still carry the legacy column.
 *
 * Run once per deployment: `npx convex run migrations:removeRepoScreenshotsVideosEnabled`
 * Delete this function after it has run everywhere it was needed.
 */
export const removeRepoScreenshotsVideosEnabled = internalMutation({
  args: {},
  returns: v.object({ reposPatched: v.number() }),
  handler: async (ctx) => {
    let reposPatched = 0;
    const repos = await ctx.db.query("githubRepos").collect();
    for (const repo of repos) {
      const cleaned = stripLegacyRepoField(repo);
      if (!cleaned) {
        continue;
      }
      await ctx.db.replace(repo._id, cleaned);
      reposPatched++;
    }
    console.log(
      `[migration] removeRepoScreenshotsVideosEnabled: patched ${reposPatched} repos`,
    );
    return { reposPatched };
  },
});
