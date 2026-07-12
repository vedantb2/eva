import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type LegacySessionJson = {
  startupRequestedAt?: number;
};

function stripLegacySessionFields(
  session: Doc<"sessions">,
): Omit<Doc<"sessions">, "_id" | "_creationTime"> | null {
  const serialized = JSON.stringify(session);
  const parsed: Doc<"sessions"> & LegacySessionJson = JSON.parse(serialized);
  if (parsed.startupRequestedAt === undefined) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    startupRequestedAt: omittedStartupRequestedAt,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedStartupRequestedAt;
  return rest;
}

/**
 * Drops `startupRequestedAt` from session docs left over after the field was
 * removed from sessionFields. Without this, sessions:list fails validation on
 * dev deployments that still have the legacy column.
 *
 * Run once: `npx convex run migrations:removeSessionStartupRequestedAt`
 * Delete this function after it has run everywhere it was needed.
 */
export const removeSessionStartupRequestedAt = internalMutation({
  args: {},
  returns: v.object({ sessionsPatched: v.number() }),
  handler: async (ctx) => {
    let sessionsPatched = 0;
    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      const cleaned = stripLegacySessionFields(session);
      if (!cleaned) {
        continue;
      }
      await ctx.db.replace(session._id, cleaned);
      sessionsPatched++;
    }
    console.log(
      `[migration] removeSessionStartupRequestedAt: patched ${sessionsPatched} sessions`,
    );
    return { sessionsPatched };
  },
});
