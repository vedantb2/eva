import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Backfills a `https://` scheme onto any `deploymentUrl` stored as a bare
 * hostname. Earlier polling runs stored Vercel's branch alias verbatim (e.g.
 * `my-app-git-feat-team.vercel.app`), which the browser treats as a relative
 * path when rendered in `<a href>`. Once this has run, delete this function.
 */
export const backfillDeploymentUrlScheme = internalMutation({
  args: {},
  returns: v.object({ runsFixed: v.number(), sessionsFixed: v.number() }),
  handler: async (ctx) => {
    let runsFixed = 0;
    let sessionsFixed = 0;

    const runs = await ctx.db.query("agentRuns").collect();
    for (const run of runs) {
      const url = run.deploymentUrl;
      if (url && !/^https?:\/\//.test(url)) {
        await ctx.db.patch(run._id, { deploymentUrl: `https://${url}` });
        runsFixed++;
      }
    }

    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      const url = session.deploymentUrl;
      if (url && !/^https?:\/\//.test(url)) {
        await ctx.db.patch(session._id, { deploymentUrl: `https://${url}` });
        sessionsFixed++;
      }
    }

    console.log(
      `[migration] backfillDeploymentUrlScheme: fixed ${runsFixed} runs, ${sessionsFixed} sessions`,
    );
    return { runsFixed, sessionsFixed };
  },
});
