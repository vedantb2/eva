"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getSandboxHandle } from "./helpers";
import { launchPreviewDevServer } from "./sessions";

/**
 * Relaunches the managed dev server when the preview readiness poll finds the
 * sandbox running but nothing serving the app port.
 *
 * Nothing watches the dev server after launch: an OOM kill, or a lazily
 * resumed VM (any exec on a stopped Vercel sandbox restores the filesystem but
 * none of the services), leaves the app port dead while the owner stays
 * active — the preview shows not-ready forever, Console shows no dev server,
 * and the navigation proxy is never ensured because that only happens on a
 * passing probe. This action closes the loop through the single Console
 * launcher (`launchPreviewDevServer` → tmux), so the relaunched server is
 * visible in Console and the proxy self-heals on the next ready poll.
 *
 * Idempotence lives in the launcher: it skips when something already listens
 * on the port, so races with a slow-compiling but live server are harmless.
 *
 * A sandbox can be owned by a session, a quick task, or a project chat — the
 * readiness poll that schedules this action is entity-agnostic (it only knows
 * sandboxId/port), so the owner is resolved here by sandbox id, checked in
 * that order (sessions first, matching the pre-existing behavior).
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
    if (session) {
      // "starting" owns service launches: the startup flow resolves the real
      // port and launches the dev server itself, and this recovery racing it
      // with a stale sticky devPort is exactly how a duplicate server
      // appeared on the wrong port (observed in prod: startup launched
      // 13000, a recovery scheduled during startup launched 3001 one second
      // later).
      if (
        session.status === "closed" ||
        session.status === "stopping" ||
        session.status === "starting"
      )
        return null;
      if (session.devPort === undefined || session.devCommand === undefined)
        return null;
      // Multi-app repos preview secondary apps on their own ports; this
      // recovery only owns the primary dev server.
      if (session.devPort !== args.expectedPort) return null;

      const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
      // Never exec on a non-running sandbox — on Vercel any exec lazily
      // resumes a stopped VM (see prewarmNeverResurrects contract).
      // handle.state is fresh: getSandboxHandle fetches with resume:false.
      if (handle.state !== "running") return null;

      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      });
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
    }

    const task = await ctx.runQuery(internal.agentTasks.getBySandboxInternal, {
      sandboxId: args.sandboxId,
    });
    if (task) {
      if (
        task.reviewTaskSandboxStatus === "closed" ||
        task.reviewTaskSandboxStatus === "stopping" ||
        task.reviewTaskSandboxStatus === "starting"
      )
        return null;
      if (task.devPort === undefined || task.devCommand === undefined)
        return null;
      if (task.devPort !== args.expectedPort) return null;

      const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
      if (handle.state !== "running") return null;

      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      });
      console.log(
        `[sandbox] preview recovery: relaunching dev server sandbox=${args.sandboxId} port=${task.devPort}`,
      );
      await launchPreviewDevServer(
        handle,
        `task-${task._id}`,
        task.devCommand,
        task.devPort,
        repo?.rootDirectory ?? "",
      );
      return null;
    }

    const project = await ctx.runQuery(internal.projects.getBySandboxInternal, {
      sandboxId: args.sandboxId,
    });
    if (!project) return null;
    if (
      project.reviewProjectSandboxStatus === "closed" ||
      project.reviewProjectSandboxStatus === "stopping" ||
      project.reviewProjectSandboxStatus === "starting"
    )
      return null;
    if (project.devPort === undefined || project.devCommand === undefined)
      return null;
    if (project.devPort !== args.expectedPort) return null;

    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    if (handle.state !== "running") return null;

    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });
    console.log(
      `[sandbox] preview recovery: relaunching dev server sandbox=${args.sandboxId} port=${project.devPort}`,
    );
    await launchPreviewDevServer(
      handle,
      `project-${project._id}`,
      project.devCommand,
      project.devPort,
      repo?.rootDirectory ?? "",
    );
    return null;
  },
});
