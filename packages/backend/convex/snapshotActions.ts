"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveEnvVars } from "./envVarResolver";
import { getInstallationToken } from "./githubAuth";
import { getDaytona } from "./_daytona/helpers";

const POLL_INTERVAL_MS = 30000;
const MAX_POLLS = 40;
const MAX_FIND_ATTEMPTS = 5;
const GITHUB_API = "https://api.github.com";

function githubFetch(
  path: string,
  token: string,
  options?: { method?: string; body?: string },
): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: options?.body,
  });
}

export const rebuildSnapshot = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    repoSnapshotId: v.id("repoSnapshots"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(
      internal.repoSnapshots.getRepoSnapshotInternal,
      { repoSnapshotId: args.repoSnapshotId },
    );
    if (!config) {
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: "Snapshot config not found",
      });
      return null;
    }

    const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
      repoId: config.repoId,
    });
    if (!repo) {
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: "GitHub repo not found",
      });
      return null;
    }

    let token: string;
    try {
      token = await getInstallationToken(repo.installationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: `Failed to get GitHub installation token: ${message}`,
      });
      return null;
    }

    const dispatchedAt = new Date().toISOString();

    try {
      const resp = await githubFetch(
        `/repos/${repo.owner}/${repo.name}/actions/workflows/rebuild-snapshot.yml/dispatches`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            ref: config.workflowRef ?? "main",
            inputs: {
              snapshot_name: config.snapshotName,
            },
          }),
        },
      );

      if (!resp.ok) {
        const body = await resp.text();
        const workflowInputError =
          resp.status === 422 && body.includes("Unexpected inputs provided");
        const notFoundError = resp.status === 404;
        const permissionError =
          resp.status === 403 &&
          body.includes("Resource not accessible by integration");
        await ctx.runMutation(internal.repoSnapshots.completeBuild, {
          buildId: args.buildId,
          status: "error",
          logs: "",
          error: workflowInputError
            ? "GitHub workflow dispatch failed: rebuild-snapshot.yml in the target repo does not define the snapshot_name workflow_dispatch input."
            : notFoundError
              ? `GitHub workflow dispatch failed (404): rebuild-snapshot.yml not found on branch "${config.workflowRef ?? "main"}". Verify the workflow file exists on the target branch (check Workflow Branch field in config).`
              : permissionError
                ? "GitHub workflow dispatch failed (403): The GitHub App does not have 'actions:write' permission. Go to GitHub App settings → Permissions & events → Repository permissions → Actions → Read and write, then save and accept the new permissions on all installations."
                : `GitHub workflow dispatch failed (${resp.status}): ${body}`,
        });
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: `Failed to trigger GitHub workflow: ${message}`,
      });
      return null;
    }

    await ctx.runMutation(internal.repoSnapshots.appendLogs, {
      buildId: args.buildId,
      chunk: "GitHub Actions workflow triggered. Waiting for run to start...\n",
    });

    await ctx.scheduler.runAfter(
      20000,
      internal.snapshotActions.pollWorkflowRun,
      {
        buildId: args.buildId,
        repoOwner: repo.owner,
        repoName: repo.name,
        installationId: repo.installationId,
        dispatchedAt,
        attempt: 1,
      },
    );

    return null;
  },
});

export const pollWorkflowRun = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    repoOwner: v.string(),
    repoName: v.string(),
    installationId: v.number(),
    dispatchedAt: v.string(),
    workflowRunId: v.optional(v.number()),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let token: string;
    try {
      token = await getInstallationToken(args.installationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: `Failed to get GitHub installation token during polling: ${message}`,
      });
      return null;
    }

    try {
      let runId = args.workflowRunId;

      if (runId === undefined) {
        const resp = await githubFetch(
          `/repos/${args.repoOwner}/${args.repoName}/actions/workflows/rebuild-snapshot.yml/runs?created=>${args.dispatchedAt}&per_page=5`,
          token,
        );

        if (resp.ok) {
          const data = await resp.json();
          if (
            data.workflow_runs &&
            Array.isArray(data.workflow_runs) &&
            data.workflow_runs.length > 0
          ) {
            runId = Number(data.workflow_runs[0].id);
            await ctx.runMutation(internal.repoSnapshots.setWorkflowRunId, {
              buildId: args.buildId,
              workflowRunId: runId,
            });
            await ctx.runMutation(internal.repoSnapshots.appendLogs, {
              buildId: args.buildId,
              chunk: `[Poll ${args.attempt}] Found workflow run #${runId}\n`,
            });
          }
        }

        if (runId === undefined) {
          if (args.attempt >= MAX_FIND_ATTEMPTS) {
            await ctx.runMutation(internal.repoSnapshots.completeBuild, {
              buildId: args.buildId,
              status: "error",
              logs: `[Poll ${args.attempt}] Could not find GitHub Actions workflow run.\n`,
              error:
                "GitHub Actions workflow run not found. Ensure rebuild-snapshot.yml exists in the repo and the GitHub App has actions:write permission.",
            });
            return null;
          }

          await ctx.runMutation(internal.repoSnapshots.appendLogs, {
            buildId: args.buildId,
            chunk: `[Poll ${args.attempt}] Waiting for workflow run to appear...\n`,
          });

          await ctx.scheduler.runAfter(
            POLL_INTERVAL_MS,
            internal.snapshotActions.pollWorkflowRun,
            {
              buildId: args.buildId,
              repoOwner: args.repoOwner,
              repoName: args.repoName,
              installationId: args.installationId,
              dispatchedAt: args.dispatchedAt,
              attempt: args.attempt + 1,
            },
          );
          return null;
        }
      }

      const resp = await githubFetch(
        `/repos/${args.repoOwner}/${args.repoName}/actions/runs/${runId}`,
        token,
      );

      if (!resp.ok) {
        throw new Error(`Failed to get workflow run status (${resp.status})`);
      }

      const run = await resp.json();
      const status = String(run.status ?? "");
      const conclusion = run.conclusion ? String(run.conclusion) : null;

      if (status === "completed") {
        const runUrl = `https://github.com/${args.repoOwner}/${args.repoName}/actions/runs/${runId}`;
        if (conclusion === "success") {
          await ctx.runMutation(internal.repoSnapshots.completeBuild, {
            buildId: args.buildId,
            status: "success",
            logs: `[Poll ${args.attempt}] Workflow completed successfully.\nRun: ${runUrl}\n`,
          });
        } else {
          await ctx.runMutation(internal.repoSnapshots.completeBuild, {
            buildId: args.buildId,
            status: "error",
            logs: `[Poll ${args.attempt}] Workflow completed with conclusion: ${conclusion}\nRun: ${runUrl}\n`,
            error: `GitHub Actions workflow ${conclusion ?? "failed"}. View logs: ${runUrl}`,
          });
        }
        return null;
      }

      if (args.attempt >= MAX_POLLS) {
        await ctx.runMutation(internal.repoSnapshots.completeBuild, {
          buildId: args.buildId,
          status: "error",
          logs: `[Poll ${args.attempt}] Max poll attempts reached.\n`,
          error:
            "Snapshot build did not complete within polling window (~20 minutes)",
        });
        return null;
      }

      await ctx.runMutation(internal.repoSnapshots.appendLogs, {
        buildId: args.buildId,
        chunk: `[Poll ${args.attempt}] Status: ${status}...\n`,
      });

      await ctx.scheduler.runAfter(
        POLL_INTERVAL_MS,
        internal.snapshotActions.pollWorkflowRun,
        {
          buildId: args.buildId,
          repoOwner: args.repoOwner,
          repoName: args.repoName,
          installationId: args.installationId,
          dispatchedAt: args.dispatchedAt,
          workflowRunId: runId,
          attempt: args.attempt + 1,
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (args.attempt >= MAX_POLLS) {
        await ctx.runMutation(internal.repoSnapshots.completeBuild, {
          buildId: args.buildId,
          status: "error",
          logs: `[Poll ${args.attempt}] Error: ${message}\n`,
          error: message,
        });
      } else {
        await ctx.scheduler.runAfter(
          POLL_INTERVAL_MS,
          internal.snapshotActions.pollWorkflowRun,
          {
            buildId: args.buildId,
            repoOwner: args.repoOwner,
            repoName: args.repoName,
            installationId: args.installationId,
            dispatchedAt: args.dispatchedAt,
            workflowRunId: args.workflowRunId,
            attempt: args.attempt + 1,
          },
        );
      }
    }

    return null;
  },
});

export const deleteDaytonaSnapshot = internalAction({
  args: { snapshotName: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const envVars = await resolveEnvVars(ctx, args.repoId);
    const daytonaApiKey = envVars.DAYTONA_API_KEY;

    if (!daytonaApiKey) {
      throw new Error(
        "DAYTONA_API_KEY not found in team or repo environment variables",
      );
    }

    const daytona = getDaytona(daytonaApiKey);
    try {
      const snapshot = await daytona.snapshot.get(args.snapshotName);
      await daytona.snapshot.delete(snapshot);
    } catch {
      // Snapshot may not exist
    }
    return null;
  },
});
