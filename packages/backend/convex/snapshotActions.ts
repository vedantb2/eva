"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveAllEnvVars, resolveDaytonaApiKey } from "./envVarResolver";
import { getInstallationToken } from "./githubAuth";
import {
  getDaytona,
  buildConfigFileDownloadCommands,
  filterDownloadableConfigFiles,
  exec,
  getSandbox,
  type SandboxConfigFile,
} from "./_daytona/helpers";
import { createSandboxAndPrepareRepo, SESSION_LIFECYCLE } from "./_daytona/git";
import {
  getSnapshot,
  deleteSnapshotByName,
  waitForSnapshotRemoval,
  triggerSandboxSnapshot,
} from "./_daytona/snapshots";
import { isTerminalSnapshotState } from "./_daytona/snapshotStates";
import { Image } from "@daytonaio/sdk";
import type { Id } from "./_generated/dataModel";

const DAYTONA_API_URL = "https://app.daytona.io/api";

// Bump when buildSnapshotImage's content changes (new tools, base image, or
// layer commands) so existing image fingerprints invalidate and the next build
// rebuilds the Image even though repo/config inputs are unchanged.
const IMAGE_DEF_VERSION = 1;

// "eva ALL=(ALL) NOPASSWD: ALL\n" — base64-encoded to avoid parentheses breaking Dockerfile RUN
const EVA_SUDOERS_B64 = "ZXZhIEFMTD0oQUxMKSBOT1BBU1NXRDogQUxMCg==";

/**
 * Sandbox entrypoint script — base64-encoded to avoid Dockerfile RUN escaping.
 * Decoded contents:
 *
 *   #!/bin/bash
 *   sudo bash -c '
 *     rm -f /var/run/docker.pid /var/run/docker.sock /run/docker/containerd/containerd.pid \
 *           /run/docker/containerd/containerd.sock /run/docker/containerd/containerd.sock.ttrpc \
 *           /run/docker/containerd/containerd-debug.sock 2>/dev/null || true
 *     setsid dockerd </dev/null >/var/log/dockerd.log 2>&1 &
 *   '
 *   exec sleep infinity
 *
 * Daytona runs the snapshot's entrypoint in a dedicated session that's
 * re-launched on every resume from auto-stop. This script starts dockerd
 * (cleaning up stale pidfiles/sockets first) so Docker survives the
 * stop/resume cycle without needing Eva's backend to call ensureDockerDaemon.
 * ensureDockerDaemon remains as a defensive fallback for older snapshots and
 * cold-start races.
 */
const EVA_ENTRYPOINT_B64 =
  "IyEvYmluL2Jhc2gKIyBFdmEgc2FuZGJveCBlbnRyeXBvaW50IOKAlCBzdGFydHMgZG9ja2VyZCwgdGhlbiBzbGVlcHMuIERheXRvbmEgcmUtcnVucyB0aGlzCiMgb24gZXZlcnkgcmVzdW1lIGZyb20gYXV0by1zdG9wLCBzbyBkb2NrZXJkIHN1cnZpdmVzIHRoZSByZXN1bWUgY3ljbGUgd2l0aG91dAojIG5lZWRpbmcgRXZhJ3MgYmFja2VuZCB0byBjYWxsIGVuc3VyZURvY2tlckRhZW1vbi4gZW5zdXJlRG9ja2VyRGFlbW9uIHN0YXlzIGFzCiMgYSBkZWZlbnNpdmUgZmFsbGJhY2sgZm9yIG9sZGVyIHNuYXBzaG90cyBhbmQgY29sZC1zdGFydCByYWNlcy4Kc3VkbyBiYXNoIC1jICcKICBybSAtZiAvdmFyL3J1bi9kb2NrZXIucGlkIC92YXIvcnVuL2RvY2tlci5zb2NrIC9ydW4vZG9ja2VyL2NvbnRhaW5lcmQvY29udGFpbmVyZC5waWQgL3J1bi9kb2NrZXIvY29udGFpbmVyZC9jb250YWluZXJkLnNvY2sgL3J1bi9kb2NrZXIvY29udGFpbmVyZC9jb250YWluZXJkLnNvY2sudHRycGMgL3J1bi9kb2NrZXIvY29udGFpbmVyZC9jb250YWluZXJkLWRlYnVnLnNvY2sgMj4vZGV2L251bGwgfHwgdHJ1ZQogIHNldHNpZCBkb2NrZXJkIDwvZGV2L251bGwgPi92YXIvbG9nL2RvY2tlcmQubG9nIDI+JjEgJgonCmV4ZWMgc2xlZXAgaW5maW5pdHkK";

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
  configFiles: SandboxConfigFile[] = [],
  buildCommands: string[] = [],
): Image {
  const appSlug = process.env.GITHUB_APP_SLUG;
  const botUserId = process.env.GITHUB_BOT_USER_ID;
  if (!appSlug || !botUserId) {
    throw new Error(
      "GITHUB_APP_SLUG and GITHUB_BOT_USER_ID must be set in Convex env",
    );
  }
  const gitConfigCmd = `git config --global user.name "${appSlug}[bot]" && git config --global user.email "${botUserId}+${appSlug}[bot]@users.noreply.github.com"`;

  const baseImage = Image.base("node:20-bookworm")
    .runCommands(
      "apt-get update && apt-get install -y git curl jq ripgrep fd-find git-lfs gh sudo",
      // GUI/VNC/X11 packages for desktop mode
      "apt-get install -y xvfb xfce4 xfce4-terminal x11vnc novnc dbus-x11 x11-utils libx11-6 libxrandr2 libxext6 libxrender1 libxfixes3 libxss1 libxtst6 libxi6",
      // Fix DNS: xfce4 pulls in libnss-mdns which inserts mdns4_minimal [NOTFOUND=return]
      // before dns in nsswitch.conf, causing getaddrinfo() to fail for external hosts
      "sed -i 's/mdns4_minimal \\[NOTFOUND=return\\] //' /etc/nsswitch.conf",
      // Daytona sandboxes do not support IPv6 — force IPv4 DNS resolution
      "echo 'precedence ::ffff:0:0/96 100' > /etc/gai.conf",
      // Chrome
      'apt-get install -y wget gnupg && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && apt-get update && apt-get install -y google-chrome-stable',
      // Docker Engine (includes Docker Compose V2 plugin)
      "curl -fsSL https://get.docker.com | VERSION=28.3.3 sh",
      // Docker daemon config: explicit DNS, lower MTU for nested Docker, disable IPv6
      'mkdir -p /etc/docker && echo \'{"dns":["1.1.1.1","8.8.8.8"],"mtu":1400,"ipv6":false,"ip6tables":false,"max-concurrent-downloads":3}\' > /etc/docker/daemon.json',
      // Passwordless sudo for eva (base64-encoded to avoid parentheses breaking Dockerfile RUN)
      `printf %s ${EVA_SUDOERS_B64}|base64 -d>/etc/sudoers.d/eva&&chmod 440 /etc/sudoers.d/eva`,
      // Install sandbox entrypoint script (starts dockerd on every Daytona resume)
      `printf %s ${EVA_ENTRYPOINT_B64}|base64 -d>/usr/local/bin/eva-entrypoint.sh&&chmod 755 /usr/local/bin/eva-entrypoint.sh`,
      // Cleanup
      "rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*",
      // Node/pnpm setup
      "corepack enable",
      "ln -s /usr/bin/fdfind /usr/local/bin/fd",
      "git lfs install --system",
      // Global npm packages
      "npm install -g @anthropic-ai/claude-code @openai/codex opencode-ai agent-browser convex agentation-mcp@1.2.0",
      // Code-server
      "curl -fsSL https://code-server.dev/install.sh | sh",
      // Supabase CLI (pinned version — npm global install not supported, API calls hit rate limits)
      "curl -fsSL https://github.com/supabase/cli/releases/download/v2.90.0/supabase_2.90.0_linux_amd64.deb -o /tmp/supabase.deb && dpkg -i /tmp/supabase.deb && rm /tmp/supabase.deb",
      // Create user and workspace
      "useradd -m -s /bin/bash eva && usermod -aG docker eva && mkdir -p /workspace && chown eva:eva /workspace",
    )
    .dockerfileCommands(["USER eva"])
    .workdir("/workspace")
    .runCommands(
      // Pin pnpm to a Node-20-compatible version. Without this, `corepack enable` lets
      // pnpm download the latest version on first invocation — pnpm v11+ requires Node
      // v22.13+ and uses `node:sqlite`, which crashes on node:20-bookworm.
      "corepack prepare pnpm@10.33.4 --activate",
      // Git config
      gitConfigCmd,
      // Cursor CLI (installs `cursor-agent` to /home/eva/.local/bin — curl-bash, not npm)
      "curl -fsS https://cursor.com/install | bash",
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
      PATH: "/home/eva/.pnpm:/home/eva/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      // Use Docker Hub instead of ECR — Daytona sandboxes can't reach public.ecr.aws reliably
      SUPABASE_INTERNAL_IMAGE_REGISTRY: "docker.io",
    })
    .runCommands(
      "mkdir -p /home/eva/.pnpm",
      // Clone the target repo
      `git clone --branch ${branch} https://x-access-token:${token}@github.com/${owner}/${repoName}.git /tmp/repo`,
      // Stage config files outside the repo so they survive `git clean -fd` at
      // sandbox-startup time. The runtime helper copySandboxConfigFilesToWorkspace
      // copies them into the workspace after the worktree is normalized.
      // Each file's commands are joined with && into a single RUN so multi-chunk
      // downloads (curl chunks to /tmp, cat into final file, rm chunks) all live
      // in one Docker layer — otherwise intermediate layers would balloon image
      // size with /tmp blobs.
      "mkdir -p /home/eva/sandbox-config",
      ...filterDownloadableConfigFiles(configFiles).map((f) =>
        buildConfigFileDownloadCommands(f, "/home/eva/sandbox-config").join(
          " && ",
        ),
      ),
      // Mirror them into the workspace too so the build itself has them
      // available (e.g. if a build command reads them).
      ...(filterDownloadableConfigFiles(configFiles).length > 0
        ? ["cp -a /home/eva/sandbox-config/. /tmp/repo/"]
        : []),
    )
    .workdir("/tmp/repo")
    .runCommands(
      // Install dependencies
      "pnpm install --frozen-lockfile",
    );

  // Append user-defined build commands as additional RUN layers (one per
  // command for granular Docker caching). Run after pnpm install so the repo
  // and node_modules are available; executed as user `eva` in /tmp/repo.
  const withBuildCommands =
    buildCommands.length > 0
      ? baseImage.runCommands(...buildCommands)
      : baseImage;

  // Set the sandbox entrypoint last so it lands at the end of the Dockerfile
  // and isn't clobbered by later layers. Daytona re-runs this on every resume,
  // so dockerd survives auto-stop/resume without Eva intervention.
  return withBuildCommands.entrypoint(["/usr/local/bin/eva-entrypoint.sh"]);
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

    // Query sandbox config files for this repo
    const configFiles: SandboxConfigFile[] = await ctx.runQuery(
      internal.sandboxConfigFiles.getConfigFilesForSnapshot,
      { repoId: config.repoId },
    );

    const buildCommands = config.buildCommands ?? [];

    // Build the Image definition and extract the Dockerfile content
    const image = buildSnapshotImage(
      token,
      repo.owner,
      repo.name,
      branch,
      configFiles,
      buildCommands,
    );

    const configFileCount = filterDownloadableConfigFiles(configFiles).length;
    await ctx.runMutation(internal.repoSnapshots.appendLogs, {
      buildId: args.buildId,
      chunk:
        `Starting Daytona snapshot build for ${repo.owner}/${repo.name} (branch: ${branch})...\n` +
        (configFileCount > 0
          ? `Including ${configFileCount} sandbox config file(s): ${configFiles.map((f) => f.fileName).join(", ")}\n`
          : "") +
        (buildCommands.length > 0
          ? `Running ${buildCommands.length} custom build command(s) after pnpm install.\n`
          : ""),
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
        memory: 16,
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
    const snapshot = await getSnapshot(daytona, args.snapshotName);
    if (!snapshot) {
      // The base snapshot was just kicked off, so a missing one is unexpected;
      // throw so the workflow step fails (matches the prior get-throws path).
      throw new Error(`Snapshot ${args.snapshotName} not found`);
    }
    const state = snapshot.state;

    // Terminal states: fetch build logs and complete the build
    if (isTerminalSnapshotState(state)) {
      // Fetch full build logs from the Daytona API (only on terminal state to avoid wasted calls).
      // Both the URL endpoint AND the returned log-stream URL require Bearer auth.
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
            const logStream = await fetch(url, {
              headers: { Authorization: `Bearer ${daytonaApiKey}` },
            });
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

      const reason = snapshot.errorReason || "Unknown error";
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

    const deleted = await deleteSnapshotByName(daytona, args.snapshotName);
    if (deleted) {
      await ctx.runMutation(internal.repoSnapshots.appendLogs, {
        buildId: args.buildId,
        chunk: "Deleting existing snapshot, waiting for removal...\n",
      });
      await waitForSnapshotRemoval(daytona, args.snapshotName);
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
    await deleteSnapshotByName(daytona, args.snapshotName);
    return null;
  },
});

/**
 * Fingerprint of the Image inputs: the dependency lockfile's blob sha on the
 * build branch, the build commands, the config-file blobs baked into the image,
 * and IMAGE_DEF_VERSION. When this matches the value stored at the last
 * successful Image build, the workflow skips the ~11-15m rebuild — the output
 * would be byte-identical (sandboxes fetch fresh branches at boot, so a repo
 * checkout that is a few commits stale costs nothing; node_modules only drift
 * when the lockfile changes, which changes this fingerprint). Returns null when
 * the inputs cannot be determined (e.g. lockfile lookup fails) — callers must
 * treat null as "always rebuild".
 */
export const getImageFingerprint = internalAction({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args): Promise<string | null> => {
    const config = await ctx.runQuery(
      internal.repoSnapshots.getRepoSnapshotInternal,
      { repoSnapshotId: args.repoSnapshotId },
    );
    if (!config) return null;
    const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
      repoId: config.repoId,
    });
    if (!repo) return null;
    const branch = config.workflowRef ?? "main";
    let lockfileSha: string | null = null;
    try {
      const token = await getInstallationToken(repo.installationId);
      for (const lockfile of [
        "pnpm-lock.yaml",
        "package-lock.json",
        "yarn.lock",
      ]) {
        const resp = await fetch(
          `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${lockfile}?ref=${encodeURIComponent(branch)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
            },
          },
        );
        if (resp.ok) {
          const data: unknown = await resp.json();
          if (isRecord(data) && typeof data["sha"] === "string") {
            lockfileSha = data["sha"];
            break;
          }
        }
      }
    } catch (e) {
      console.error(
        `[snapshot] image fingerprint: lockfile lookup failed: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
      return null;
    }
    if (!lockfileSha) return null;
    const fileKeys: string[] = await ctx.runQuery(
      internal.sandboxConfigFiles.getConfigFileKeys,
      { repoId: config.repoId },
    );
    const payload = JSON.stringify({
      v: IMAGE_DEF_VERSION,
      branch,
      lockfileSha,
      buildCommands: config.buildCommands ?? [],
      files: fileKeys,
    });
    let hash = 5381;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash * 33) ^ payload.charCodeAt(i);
    }
    return `img-${(hash >>> 0).toString(36)}-${payload.length}`;
  },
});

/**
 * Seeded-snapshot build — LAUNCH step. Composes the app's whole seed sequence
 * (startup commands → marker → stop commands) into one bash script and launches
 * it DETACHED on the prep sandbox (setsid nohup), returning immediately.
 *
 * Convex actions have a hard 600s ceiling, so running seed commands
 * synchronously inside actions caps every command at ~9 minutes — cold docker
 * pulls and slow readiness waits blew through it repeatedly on prod. Detached,
 * the script takes as long as it needs; the workflow polls pollSeedRun for the
 * outcome markers, mirroring the trigger+poll pattern used for captures.
 */
export const launchSeedRun = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const startupCommands: string[] | null = await ctx.runQuery(
      internal.repoSnapshots.getStartupCommands,
      { repoId: args.repoId },
    );
    const stopCommands: string[] | null = await ctx.runQuery(
      internal.repoSnapshots.getStopCommands,
      { repoId: args.repoId },
    );
    const lines: string[] = [
      "#!/bin/bash",
      "exec > /tmp/seedrun.log 2>&1",
      "set -x",
      "rm -f /tmp/.seedrun-done",
    ];
    (startupCommands ?? []).forEach((command, i) => {
      // Subshell so `cd`/env in one command can't leak into the next, matching
      // how runSandboxCommand executed them as separate execs.
      lines.push(
        `( ${command} ) || { echo "SEEDRUN-FAILED:startup-${i}"; exit 1; }`,
      );
    });
    // Marker so a sandbox booting from the captured snapshot skips the seed.
    lines.push("touch /tmp/.startup-commands-done");
    (stopCommands ?? []).forEach((command, i) => {
      lines.push(
        `( ${command} ) || { echo "SEEDRUN-FAILED:stop-${i}"; exit 1; }`,
      );
    });
    lines.push('echo "SEEDRUN-DONE"', "touch /tmp/.seedrun-done");
    const script = lines.join("\n");
    const b64 = Buffer.from(script, "utf8").toString("base64");
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    // Lockfile guard makes the launch idempotent so the workflow can retry a
    // timed-out launch exec without racing a second copy of the script.
    await exec(
      sandbox,
      `if [ -f /tmp/.seedrun-started ]; then echo ALREADY-RUNNING; else touch /tmp/.seedrun-started && echo ${b64} | base64 -d > /tmp/seedrun.sh && chmod +x /tmp/seedrun.sh && setsid nohup /tmp/seedrun.sh </dev/null >/dev/null 2>&1 & echo LAUNCHED; fi`,
      120,
    );
    return null;
  },
});

/**
 * Seeded-snapshot build — SEED POLL step. Returns "done" when the detached
 * seed script finished cleanly, "failed:<stage>" when it aborted (stage names
 * the command index, e.g. startup-3), and "running" otherwise.
 */
export const pollSeedRun = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    const out = await exec(
      sandbox,
      'test -f /tmp/.seedrun-done && echo DONE; grep -aoE "SEEDRUN-FAILED:[a-z0-9-]+" /tmp/seedrun.log 2>/dev/null | tail -1; true',
      30,
    );
    if (out.includes("DONE")) return "done";
    const failed = out.match(/SEEDRUN-FAILED:([a-z0-9-]+)/);
    if (failed) return `failed:${failed[1]}`;
    return "running";
  },
});

/**
 * Seeded-snapshot build step: creates + prepares a sandbox from the base Image
 * snapshot (NOT a seeded one — passed explicitly to bypass the seeded preference
 * in getRepoSnapshotName), ready to run the app's background/seed/stop commands.
 */
export const createSeedPrepSandbox = internalAction({
  args: { repoId: v.id("githubRepos"), imageSnapshot: v.string() },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args): Promise<{ sandboxId: string }> => {
    const { daytonaApiKey, sandboxEnvVars } = await resolveDaytonaApiKey(
      ctx,
      args.repoId,
    );
    const daytona = getDaytona(daytonaApiKey);
    const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
      repoId: args.repoId,
    });
    if (!repo) throw new Error("Repo not found");
    const { sandbox } = await createSandboxAndPrepareRepo(
      ctx,
      daytona,
      repo.installationId,
      repo.owner,
      repo.name,
      { ...sandboxEnvVars, REPO_ID: args.repoId },
      SESSION_LIFECYCLE,
      args.imageSnapshot,
    );
    return { sandboxId: sandbox.id };
  },
});

// Trigger timeout (seconds) for the seeded-snapshot capture. The SDK's
// _experimental_createSnapshot fires the POST then blocks polling the sandbox
// state until the capture finishes OR this timeout elapses. We keep it small so
// the trigger action returns quickly (the snapshot keeps building server-side)
// and the workflow polls completion across separate steps — see
// triggerSeededSnapshot. Comfortable for the POST; short enough to never near
// Convex's 600s per-action ceiling.
const SEEDED_SNAPSHOT_TRIGGER_TIMEOUT_SEC = 30;

/**
 * Seeded-snapshot build — TRIGGER step. Captures the (clean-stopped) sandbox's
 * filesystem — including the seeded Docker volumes — into a reusable snapshot.
 *
 * Non-blocking by design: a seeded snapshot carries the whole seeded DB volume
 * and its capture routinely runs for many minutes. The SDK helper blocks the
 * caller polling the sandbox state for the entire capture, which exceeds
 * Convex's hard 600s action limit — the action gets killed mid-await (the
 * "unawaited operation" warning) and the app silently drops to the base Image.
 * Instead we fire the POST with a short timeout so the helper bails fast with a
 * DaytonaTimeoutError (the snapshot keeps building server-side), then poll
 * completion in separate workflow steps via pollSeededSnapshotState. Any
 * non-timeout error is a real failure and propagates to the per-app fallback.
 */
export const triggerSeededSnapshot = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    sandboxId: v.string(),
    seededName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    await triggerSandboxSnapshot(
      daytona,
      args.sandboxId,
      args.seededName,
      SEEDED_SNAPSHOT_TRIGGER_TIMEOUT_SEC,
    );
    return null;
  },
});

/**
 * Seeded-snapshot build — POLL step. Returns the snapshot entity's current state
 * ("active" on success, "error"/"build_failed" on failure, otherwise still
 * building; "pending" if it is not registered yet).
 *
 * We poll the SNAPSHOT entity, not the sandbox state: a sandbox snapshot can
 * reach "active" while the source sandbox still reports "snapshotting", so a
 * sandbox-state poll can wait out the whole window and wrongly record a fallback
 * for a snapshot that actually succeeded. The snapshot's own state is the
 * authoritative signal — the same one the base-Image build polls.
 */
export const pollSeededSnapshotState = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    seededName: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    // Not registered yet (or a transient lookup miss) → treat as still pending.
    const snapshot = await getSnapshot(daytona, args.seededName);
    return snapshot ? snapshot.state : "pending";
  },
});
