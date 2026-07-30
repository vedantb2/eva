"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getSandboxHandle } from "./helpers";
import { launchPreviewDevServer } from "./sessions";

/**
 * Relaunches a session's managed dev server when the preview readiness poll
 * finds the sandbox running but nothing serving the app port.
 *
 * Nothing watches the dev server after launch: an OOM kill, or a lazily
 * resumed VM (any exec on a stopped Vercel sandbox restores the filesystem but
 * none of the services), leaves the app port dead while the session stays
 * active — the preview shows not-ready forever, Console shows no dev server,
 * and the navigation proxy is never ensured because that only happens on a
 * passing probe. This action closes the loop through the single Console
 * launcher (`launchPreviewDevServer` → tmux), so the relaunched server is
 * visible in Console and the proxy self-heals on the next ready poll.
 *
 * Idempotence lives in the launcher: it skips when something already listens
 * on the port, so races with a slow-compiling but live server are harmless.
 */
export const ensureSessionPreviewServices = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    /** The upstream listen port the failing preview probed. */
    expectedPort: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.sessions.getBySandboxInternal, {
      sandboxId: args.sandboxId,
    });
    if (!session) return null;
    if (session.status === "closed" || session.status === "stopping")
      return null;
    if (session.devPort === undefined || session.devCommand === undefined)
      return null;
    // Multi-app repos preview secondary apps on their own ports; this recovery
    // only owns the session's primary dev server.
    if (session.devPort !== args.expectedPort) return null;

    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });
    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    // Never exec on a non-running sandbox — on Vercel any exec lazily resumes
    // a stopped VM (see prewarmNeverResurrects contract). handle.state is
    // fresh: getSandboxHandle fetches with resume:false.
    if (handle.state !== "running") return null;

    console.log(
      `[sandbox] preview recovery: relaunching dev server sandbox=${args.sandboxId} port=${session.devPort}`,
    );
    await launchPreviewDevServer(
      handle,
      `session-${session._id}`,
      session.devCommand,
      session.devPort,
      repo?.rootDirectory ?? "",
    );
    return null;
  },
});
