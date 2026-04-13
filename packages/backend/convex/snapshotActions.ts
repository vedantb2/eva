"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveAllEnvVars } from "./envVarResolver";
import { getInstallationToken } from "./githubAuth";
import { getDaytona } from "./_daytona/helpers";
import { Image } from "@daytonaio/sdk";
import type { Id } from "./_generated/dataModel";

const DAYTONA_API_URL = "https://app.daytona.io/api";

/** Type guard for record-shaped objects. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Safely extracts a URL string from an unknown JSON response. */
function extractUrl(data: unknown): string | null {
  if (!isRecord(data)) return null;
  if (typeof data["url"] === "string") return data["url"];
  return null;
}

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
      // System tools (uidmap needed for rootless Docker)
      "apt-get update && apt-get install -y git curl jq ripgrep fd-find git-lfs gh uidmap",
      // GUI/VNC/X11 packages for desktop mode
      "apt-get install -y xvfb xfce4 xfce4-terminal x11vnc novnc dbus-x11 x11-utils libx11-6 libxrandr2 libxext6 libxrender1 libxfixes3 libxss1 libxtst6 libxi6",
      // Fix DNS: xfce4 pulls in libnss-mdns which inserts mdns4_minimal [NOTFOUND=return]
      // before dns in nsswitch.conf, causing getaddrinfo() to fail for external hosts
      "sed -i 's/mdns4_minimal \\[NOTFOUND=return\\] //' /etc/nsswitch.conf",
      // Chrome
      'apt-get install -y wget gnupg && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && apt-get update && apt-get install -y google-chrome-stable',
      // Docker Engine (includes Docker Compose V2 plugin)
      "curl -fsSL https://get.docker.com | VERSION=28.3.3 sh",
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
      // Supabase CLI (download .deb from latest GitHub release — npm package has native dep issues)
      "curl -fsSL $(curl -s https://api.github.com/repos/supabase/cli/releases/latest | jq -r '.assets[] | select(.name | endswith(\"_linux_amd64.deb\")) | .browser_download_url') -o /tmp/supabase.deb && dpkg -i /tmp/supabase.deb && rm /tmp/supabase.deb",
      // Create user and workspace
      "useradd -m -s /bin/bash eva && usermod -aG docker eva && echo 'eva:100000:65536' >> /etc/subuid && echo 'eva:100000:65536' >> /etc/subgid && mkdir -p /workspace && chown eva:eva /workspace",
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
      "git clone --depth 1 https://github.com/SkillPanel/maister.git /home/eva/.claude/plugins/marketplaces/maister-plugins",
      `echo '{"enabledPlugins":{"frontend-design@claude-plugins-official":true,"superpowers@claude-plugins-official":true,"context7@claude-plugins-official":true,"interface-design@Dammyjay93":true,"maister@maister-plugins":true}}' > /home/eva/.claude/settings.json`,
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

/**
 * Workflow step 1: Resolve config, delete old snapshot, and kick off the build
 * via a direct POST to the Daytona API (returns immediately without blocking).
 * Returns { snapshotName, repoId } on success, or null if an error was recorded.
 */
export const kickOffSnapshotBuild = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    repoSnapshotId: v.id("repoSnapshots"),
  },
  returns: v.union(
    v.object({
      snapshotName: v.string(),
      repoId: v.id("githubRepos"),
    }),
    v.null(),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<{ snapshotName: string; repoId: Id<"githubRepos"> } | null> => {
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

    // Build the Image definition and extract the Dockerfile content
    const image = buildSnapshotImage(token, repo.owner, repo.name, branch);

    await ctx.runMutation(internal.repoSnapshots.appendLogs, {
      buildId: args.buildId,
      chunk: `Starting Daytona snapshot build for ${repo.owner}/${repo.name} (branch: ${branch})...\n`,
    });

    // POST directly to Daytona API to create the snapshot (returns immediately).
    // We use fetch instead of daytona.snapshot.create() because create() blocks
    // until the build finishes, which can exceed the Convex action timeout.
    const resp = await fetch(`${DAYTONA_API_URL}/snapshots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${daytonaApiKey}`,
      },
      body: JSON.stringify({
        name: config.snapshotName,
        buildInfo: {
          dockerfileContent: image.dockerfile,
          contextHashes: [],
        },
        cpu: 4,
        memory: 8,
        disk: 10,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: `Daytona API error (${resp.status}): ${body}`,
      });
      return null;
    }

    await ctx.runMutation(internal.repoSnapshots.appendLogs, {
      buildId: args.buildId,
      chunk: "Snapshot build initiated on Daytona. Polling for progress...\n",
    });

    return { snapshotName: config.snapshotName, repoId: config.repoId };
  },
});

/**
 * Workflow step 2 (called in a loop): Checks snapshot build state and streams
 * build logs from the Daytona API. Returns the current snapshot state string.
 * Each invocation is a fresh action with its own timeout.
 */
export const pollSnapshotProgress = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    snapshotName: v.string(),
    repoId: v.id("githubRepos"),
    attempt: v.number(),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    // Check if the build was already completed (e.g. by a retry or race)
    const buildStatus: string | null = await ctx.runQuery(
      internal.repoSnapshots.getBuildStatus,
      { buildId: args.buildId },
    );
    if (buildStatus !== "running") {
      return buildStatus ?? "error";
    }

    const envVars = await resolveAllEnvVars(ctx, args.repoId);
    const daytonaApiKey = envVars.DAYTONA_API_KEY;
    if (!daytonaApiKey) {
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: "DAYTONA_API_KEY not found",
      });
      return "error";
    }

    const daytona = getDaytona(daytonaApiKey);
    const snapshot = await daytona.snapshot.get(args.snapshotName);
    const state = String(snapshot.state);

    // Terminal states: fetch build logs and complete the build
    if (state === "active" || state === "error" || state === "build_failed") {
      // Fetch full build logs from the Daytona API (only on terminal state to avoid wasted calls)
      let logs = "";
      try {
        const logsResp = await fetch(
          `${DAYTONA_API_URL}/snapshots/${snapshot.id}/build-logs-url`,
          {
            headers: { Authorization: `Bearer ${daytonaApiKey}` },
          },
        );
        if (logsResp.ok) {
          const logsData: unknown = await logsResp.json();
          const url = extractUrl(logsData);
          if (url) {
            const logStream = await fetch(url);
            if (logStream.ok) {
              logs = await logStream.text();
            }
          }
        }
      } catch {
        // Log fetching is best-effort — don't fail the completion for it
      }

      if (state === "active") {
        await ctx.runMutation(internal.repoSnapshots.completeBuild, {
          buildId: args.buildId,
          status: "success",
          logs:
            (logs ? logs + "\n" : "") +
            `[Poll ${args.attempt}] Snapshot build completed successfully.\n`,
        });
        return "active";
      }

      const reason = snapshot.errorReason
        ? String(snapshot.errorReason)
        : "Unknown error";
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs:
          (logs ? logs + "\n" : "") +
          `[Poll ${args.attempt}] Snapshot state: ${state}\n`,
        error: `Snapshot build failed: ${reason}`,
      });
      return state;
    }

    // Still building — log progress
    await ctx.runMutation(internal.repoSnapshots.appendLogs, {
      buildId: args.buildId,
      chunk: `[Poll ${args.attempt}] Snapshot state: ${state}. Waiting...\n`,
    });

    return state;
  },
});

/**
 * Workflow step 0: Deletes the existing snapshot and waits for removal to complete.
 * daytona.snapshot.delete() returns immediately but the snapshot enters a "removing"
 * state — creating a new one with the same name will 409 until removal finishes.
 */
export const deleteExistingSnapshot = internalAction({
  args: {
    snapshotName: v.string(),
    repoId: v.id("githubRepos"),
    buildId: v.id("snapshotBuilds"),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const envVars = await resolveAllEnvVars(ctx, args.repoId);
    const daytonaApiKey = envVars.DAYTONA_API_KEY;
    if (!daytonaApiKey) {
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: "DAYTONA_API_KEY not found",
      });
      return null;
    }

    const daytona = getDaytona(daytonaApiKey);

    try {
      const existing = await daytona.snapshot.get(args.snapshotName);
      await daytona.snapshot.delete(existing);

      await ctx.runMutation(internal.repoSnapshots.appendLogs, {
        buildId: args.buildId,
        chunk: "Deleting existing snapshot, waiting for removal...\n",
      });

      // Poll until the snapshot is fully removed (get throws on not-found)
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          await daytona.snapshot.get(args.snapshotName);
        } catch {
          break;
        }
      }
    } catch {
      // Snapshot doesn't exist — nothing to delete
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
