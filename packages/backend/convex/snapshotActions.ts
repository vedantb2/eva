"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveAllEnvVars } from "./envVarResolver";
import { getInstallationToken } from "./githubAuth";
import { getDaytona } from "./_daytona/helpers";
import { Image } from "@daytonaio/sdk";

const POLL_INTERVAL_MS = 60_000;
const MAX_POLLS = 30;
const SAFETY_NET_DELAY_MS = 5 * 60 * 1000;

/**
 * Builds a Daytona Image definition that mirrors the old rebuild-snapshot.yml Dockerfile.
 * The key difference is using `git clone` (with an installation token) instead of COPY
 * so this can run from a Convex action without local filesystem access.
 */
function buildSnapshotImage(
  token: string,
  owner: string,
  repoName: string,
  branch: string,
): Image {
  return Image.base("node:20-bookworm")
    .runCommands(
      // System tools
      "apt-get update && apt-get install -y git curl jq ripgrep fd-find git-lfs gh",
      // GUI/VNC/X11 packages for desktop mode
      "apt-get install -y xvfb xfce4 xfce4-terminal x11vnc novnc dbus-x11 x11-utils libx11-6 libxrandr2 libxext6 libxrender1 libxfixes3 libxss1 libxtst6 libxi6",
      // Chrome
      'apt-get install -y wget gnupg && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && apt-get update && apt-get install -y google-chrome-stable',
      // Cleanup
      "rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*",
      // Node/pnpm setup
      "corepack enable",
      "ln -s /usr/bin/fdfind /usr/local/bin/fd",
      "git lfs install --system",
      // Global npm packages
      "npm install -g @anthropic-ai/claude-code @openai/codex agent-browser convex",
      // Code-server
      "curl -fsSL https://code-server.dev/install.sh | sh",
      // Create user and workspace
      "useradd -m -s /bin/bash eva && mkdir -p /workspace && chown eva:eva /workspace",
    )
    .dockerfileCommands(["USER eva"])
    .workdir("/workspace")
    .runCommands(
      // Git config
      'git config --global user.name "Eva" && git config --global user.email "48868398+vedantb2@users.noreply.github.com"',
      // Claude plugins
      "mkdir -p /home/eva/.claude/plugins/marketplaces",
      "git clone --depth 1 https://github.com/anthropics/claude-plugins-official.git /home/eva/.claude/plugins/marketplaces/claude-plugins-official",
      "git clone --depth 1 https://github.com/Dammyjay93/interface-design.git /home/eva/.claude/plugins/marketplaces/Dammyjay93",
      `echo '{"enabledPlugins":{"frontend-design@claude-plugins-official":true,"interface-design@Dammyjay93":true}}' > /home/eva/.claude/settings.json`,
    )
    .env({
      PNPM_HOME: "/home/eva/.pnpm",
      NODE_PATH: "/usr/lib/node_modules",
      PATH: "/home/eva/.pnpm:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    })
    .runCommands(
      "mkdir -p /home/eva/.pnpm",
      // Clone the target repo and install dependencies for pre-caching
      `git clone --depth 1 --branch ${branch} https://x-access-token:${token}@github.com/${owner}/${repoName}.git /tmp/repo`,
    )
    .workdir("/tmp/repo")
    .runCommands("pnpm install --frozen-lockfile");
}

/** Builds a Daytona snapshot directly via the SDK, replacing the old GitHub Actions workflow dispatch. */
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

    let daytonaApiKey: string;
    try {
      const envVars = await resolveAllEnvVars(ctx, config.repoId);
      const key = envVars.DAYTONA_API_KEY;
      if (!key) {
        throw new Error(
          "DAYTONA_API_KEY not found in team or repo environment variables",
        );
      }
      daytonaApiKey = key;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: message,
      });
      return null;
    }

    const daytona = getDaytona(daytonaApiKey);
    const branch = config.workflowRef ?? "main";

    // Delete existing snapshot before rebuilding
    try {
      const existing = await daytona.snapshot.get(config.snapshotName);
      await daytona.snapshot.delete(existing);
    } catch {
      // Snapshot may not exist yet — that's fine
    }

    const image = buildSnapshotImage(token, repo.owner, repo.name, branch);

    await ctx.runMutation(internal.repoSnapshots.appendLogs, {
      buildId: args.buildId,
      chunk: `Starting Daytona snapshot build for ${repo.owner}/${repo.name} (branch: ${branch})...\n`,
    });

    // Schedule safety-net poller in case this action times out before create() finishes.
    // The poller checks snapshot state directly via the Daytona API.
    await ctx.scheduler.runAfter(
      SAFETY_NET_DELAY_MS,
      internal.snapshotActions.pollSnapshotBuild,
      {
        buildId: args.buildId,
        snapshotName: config.snapshotName,
        repoId: config.repoId,
        attempt: 1,
      },
    );

    // Collect build logs in a local buffer (onLogs is synchronous, can't await inside it)
    let logBuffer = "";
    try {
      await daytona.snapshot.create(
        {
          name: config.snapshotName,
          image,
          resources: { cpu: 4, memory: 8, disk: 10 },
        },
        {
          onLogs: (chunk: string) => {
            logBuffer += chunk + "\n";
          },
        },
      );

      // Build succeeded — flush logs and complete
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "success",
        logs: logBuffer + "Snapshot build completed successfully.\n",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: logBuffer,
        error: `Snapshot build failed: ${message}`,
      });
    }

    return null;
  },
});

/**
 * Safety-net poller that checks snapshot build state directly via the Daytona API.
 * Handles the case where rebuildSnapshot's action times out before snapshot.create() finishes.
 * If the build was already completed by rebuildSnapshot, this is a no-op.
 */
export const pollSnapshotBuild = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    snapshotName: v.string(),
    repoId: v.id("githubRepos"),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if the build was already completed by rebuildSnapshot
    const buildStatus = await ctx.runQuery(
      internal.repoSnapshots.getBuildStatus,
      { buildId: args.buildId },
    );
    if (buildStatus !== "running") {
      return null;
    }

    let daytonaApiKey: string;
    try {
      const envVars = await resolveAllEnvVars(ctx, args.repoId);
      const key = envVars.DAYTONA_API_KEY;
      if (!key) {
        throw new Error("DAYTONA_API_KEY not found");
      }
      daytonaApiKey = key;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: `[Poll ${args.attempt}] ${message}\n`,
        error: message,
      });
      return null;
    }

    const daytona = getDaytona(daytonaApiKey);

    try {
      const snapshot = await daytona.snapshot.get(args.snapshotName);
      const state = String(snapshot.state);

      if (state === "active") {
        await ctx.runMutation(internal.repoSnapshots.completeBuild, {
          buildId: args.buildId,
          status: "success",
          logs: `[Poll ${args.attempt}] Snapshot is active. Build completed successfully.\n`,
        });
        return null;
      }

      if (state === "error" || state === "build_failed") {
        const reason = snapshot.errorReason
          ? String(snapshot.errorReason)
          : "Unknown error";
        await ctx.runMutation(internal.repoSnapshots.completeBuild, {
          buildId: args.buildId,
          status: "error",
          logs: `[Poll ${args.attempt}] Snapshot state: ${state}\n`,
          error: `Snapshot build failed: ${reason}`,
        });
        return null;
      }

      // Still building — schedule next poll or give up
      if (args.attempt >= MAX_POLLS) {
        await ctx.runMutation(internal.repoSnapshots.completeBuild, {
          buildId: args.buildId,
          status: "error",
          logs: `[Poll ${args.attempt}] Max poll attempts reached.\n`,
          error:
            "Snapshot build did not complete within polling window (~30 minutes)",
        });
        return null;
      }

      await ctx.runMutation(internal.repoSnapshots.appendLogs, {
        buildId: args.buildId,
        chunk: `[Poll ${args.attempt}] Snapshot state: ${state}. Waiting...\n`,
      });

      await ctx.scheduler.runAfter(
        POLL_INTERVAL_MS,
        internal.snapshotActions.pollSnapshotBuild,
        {
          buildId: args.buildId,
          snapshotName: args.snapshotName,
          repoId: args.repoId,
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
        await ctx.runMutation(internal.repoSnapshots.appendLogs, {
          buildId: args.buildId,
          chunk: `[Poll ${args.attempt}] Error checking snapshot state: ${message}. Retrying...\n`,
        });

        await ctx.scheduler.runAfter(
          POLL_INTERVAL_MS,
          internal.snapshotActions.pollSnapshotBuild,
          {
            buildId: args.buildId,
            snapshotName: args.snapshotName,
            repoId: args.repoId,
            attempt: args.attempt + 1,
          },
        );
      }
    }

    return null;
  },
});

/** Deletes a Daytona snapshot via the Daytona SDK. */
export const deleteDaytonaSnapshot = internalAction({
  args: { snapshotName: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const envVars = await resolveAllEnvVars(ctx, args.repoId);
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
