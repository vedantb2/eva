import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type LegacyUserJson = {
  experimentalSessionTabsEnabled?: boolean;
  blurPidEnabled?: boolean;
  voiceDictationEnabled?: boolean;
};

type UserRest = Omit<Doc<"users">, "_id" | "_creationTime">;

/**
 * Copies legacy top-level experimental booleans into `users.experimentalFlags`,
 * then strips those columns so the schema can drop them.
 *
 * Run once on each deployment:
 *   npx convex run migrations:backfillExperimentalFlags
 *   npx convex run migrations:backfillExperimentalFlags --prod
 */
export const backfillExperimentalFlags = internalMutation({
  args: {},
  returns: v.object({ usersPatched: v.number() }),
  handler: async (ctx) => {
    let usersPatched = 0;
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      const serialized = JSON.stringify(user);
      const parsed: Doc<"users"> & LegacyUserJson = JSON.parse(serialized);
      const hasLegacy =
        parsed.experimentalSessionTabsEnabled !== undefined ||
        parsed.blurPidEnabled !== undefined ||
        parsed.voiceDictationEnabled !== undefined;
      if (!hasLegacy && parsed.experimentalFlags !== undefined) {
        continue;
      }
      if (!hasLegacy) {
        continue;
      }

      const experimentalFlags = {
        ...parsed.experimentalFlags,
      };
      if (
        experimentalFlags.sessionTabs === undefined &&
        parsed.experimentalSessionTabsEnabled !== undefined
      ) {
        experimentalFlags.sessionTabs = parsed.experimentalSessionTabsEnabled;
      }
      if (
        experimentalFlags.blurPid === undefined &&
        parsed.blurPidEnabled !== undefined
      ) {
        experimentalFlags.blurPid = parsed.blurPidEnabled;
      }
      if (
        experimentalFlags.voiceDictation === undefined &&
        parsed.voiceDictationEnabled !== undefined
      ) {
        experimentalFlags.voiceDictation = parsed.voiceDictationEnabled;
      }

      const {
        _id: omittedId,
        _creationTime: omittedCreationTime,
        experimentalSessionTabsEnabled: omittedSessionTabs,
        blurPidEnabled: omittedBlurPid,
        voiceDictationEnabled: omittedVoice,
        ...rest
      } = parsed;
      void omittedId;
      void omittedCreationTime;
      void omittedSessionTabs;
      void omittedBlurPid;
      void omittedVoice;

      const cleaned: UserRest = {
        ...rest,
        experimentalFlags,
      };
      await ctx.db.replace(user._id, cleaned);
      usersPatched++;
    }
    console.log(
      `[migration] backfillExperimentalFlags: patched ${usersPatched} users`,
    );
    return { usersPatched };
  },
});
