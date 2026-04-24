"use node";

import { v } from "convex/values";
import { quote } from "shell-quote";
import type { GenericActionCtx } from "convex/server";
import type { CreateSandboxFromSnapshotParams, Sandbox } from "@daytonaio/sdk";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveAllEnvVars, resolveDaytonaApiKey } from "./envVarResolver";
import { buildGitHubRepoUrl, getInstallationToken } from "./githubAuth";
import {
  exec,
  getExperimentalDaytona,
  getExperimentalSandbox,
} from "./_daytona/helpers";
import type { DataModel, Id } from "./_generated/dataModel";

const BASE_SNAPSHOT = "daytona-large";
const BUILD_SANDBOX_READY_TIMEOUT_SECONDS = 60;
const TOOLING_TIMEOUT_SECONDS = 900;
const REPO_CLONE_TIMEOUT_SECONDS = 300;
const PNPM_INSTALL_TIMEOUT_SECONDS = 900;
const STARTUP_COMMAND_TIMEOUT_SECONDS = 600;
const CREATE_SNAPSHOT_TIMEOUT_SECONDS = 900;

const SNAPSHOT_ENV = {
  PNPM_HOME: "/home/eva/.pnpm",
  NODE_PATH: "/usr/lib/node_modules",
  PATH: "/home/eva/.pnpm:/home/eva/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
  SUPABASE_INTERNAL_IMAGE_REGISTRY: "docker.io",
};

// "eva ALL=(ALL) NOPASSWD: ALL\n"
const EVA_SUDOERS_B64 = "ZXZhIEFMTD0oQUxMKSBOT1BBU1NXRDogQUxMCg==";

type BuilderSandboxResult = {
  sandboxId: string;
  snapshotName: string;
  repoId: Id<"githubRepos">;
  branch: string;
  startupCommands: string[] | undefined;
};

/** Converts an error into a stable message. */
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

/** Runs a command with root privileges when the sandbox default user is not root. */
function rootCommand(command: string): string {
  return `if [ "$(id -u)" = "0" ]; then ${command}; else sudo sh -lc ${quote([command])}; fi`;
}

/** Runs a command under the eva user after the live builder creates it. */
function evaCommand(command: string): string {
  return `sudo -H -u eva env PNPM_HOME=${quote([SNAPSHOT_ENV.PNPM_HOME])} NODE_PATH=${quote([SNAPSHOT_ENV.NODE_PATH])} PATH=${quote([SNAPSHOT_ENV.PATH])} SUPABASE_INTERNAL_IMAGE_REGISTRY=${quote([SNAPSHOT_ENV.SUPABASE_INTERNAL_IMAGE_REGISTRY])} sh -lc ${quote([command])}`;
}

/** Appends a concise log line to the snapshot build. */
async function appendBuildLog(
  ctx: GenericActionCtx<DataModel>,
  buildId: Id<"snapshotBuilds">,
  chunk: string,
): Promise<void> {
  await ctx.runMutation(internal.repoSnapshots.appendLogs, { buildId, chunk });
}

/** Executes and logs one live snapshot build step. */
async function runSnapshotStep(
  ctx: GenericActionCtx<DataModel>,
  buildId: Id<"snapshotBuilds">,
  sandbox: Sandbox,
  label: string,
  command: string,
  timeoutSeconds: number,
  cwd = "/",
): Promise<void> {
  await appendBuildLog(ctx, buildId, `Starting: ${label}\n`);
  const startedAt = Date.now();
  await exec(sandbox, command, timeoutSeconds, cwd);
  await appendBuildLog(
    ctx,
    buildId,
    `Completed: ${label} (${Date.now() - startedAt}ms)\n`,
  );
}

/** Marks the build as failed and attempts sandbox cleanup. */
async function failBuildAndCleanup(
  ctx: GenericActionCtx<DataModel>,
  buildId: Id<"snapshotBuilds">,
  repoId: Id<"githubRepos">,
  sandboxId: string | undefined,
  error: string,
): Promise<null> {
  await ctx.runMutation(internal.repoSnapshots.completeBuild, {
    buildId,
    status: "error",
    logs: `Build failed: ${error}\n`,
    error,
  });

  if (sandboxId) {
    try {
      const sandbox = await getExperimentalSandbox(ctx, repoId, sandboxId);
      await sandbox.delete();
      await appendBuildLog(ctx, buildId, `Cleaned up sandbox ${sandboxId}.\n`);
    } catch (cleanupError) {
      await appendBuildLog(
        ctx,
        buildId,
        `Sandbox cleanup failed: ${errorMessage(cleanupError)}\n`,
      );
    }
  }

  return null;
}

/**
 * Step 1: Creates the builder sandbox in the Experimental region.
 * Returns sandbox ID on success, null on failure.
 */
export const createBuilderSandbox = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    repoSnapshotId: v.id("repoSnapshots"),
  },
  returns: v.union(
    v.object({
      sandboxId: v.string(),
      snapshotName: v.string(),
      repoId: v.id("githubRepos"),
      branch: v.string(),
      startupCommands: v.optional(v.array(v.string())),
    }),
    v.null(),
  ),
  handler: async (ctx, args): Promise<BuilderSandboxResult | null> => {
    try {
      const config = await ctx.runQuery(
        internal.repoSnapshots.getRepoSnapshotInternal,
        { repoSnapshotId: args.repoSnapshotId },
      );
      if (!config) {
        throw new Error("Snapshot config not found");
      }

      const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
        repoId: config.repoId,
      });
      if (!repo) {
        throw new Error("GitHub repo not found");
      }

      const { daytonaApiKey, sandboxEnvVars } = await resolveDaytonaApiKey(
        ctx,
        config.repoId,
      );

      const branch = config.workflowRef ?? "main";
      const daytona = getExperimentalDaytona(daytonaApiKey);

      await appendBuildLog(
        ctx,
        args.buildId,
        `Starting live snapshot build for ${repo.owner}/${repo.name} (branch: ${branch}, target: experimental, base: ${BASE_SNAPSHOT}).\n`,
      );

      const createParams: CreateSandboxFromSnapshotParams = {
        snapshot: BASE_SNAPSHOT,
        envVars: {
          ...sandboxEnvVars,
          ...SNAPSHOT_ENV,
          REPO_ID: config.repoId,
        },
        autoStopInterval: 30,
        autoDeleteInterval: 120,
        ephemeral: true,
      };
      const sandbox = await daytona.create(createParams, {
        timeout: BUILD_SANDBOX_READY_TIMEOUT_SECONDS,
      });

      await appendBuildLog(
        ctx,
        args.buildId,
        `Builder sandbox created: ${sandbox.id}\n`,
      );

      return {
        sandboxId: sandbox.id,
        snapshotName: config.snapshotName,
        repoId: config.repoId,
        branch,
        startupCommands: config.startupCommands,
      };
    } catch (error) {
      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: `Failed to create builder sandbox: ${errorMessage(error)}\n`,
        error: errorMessage(error),
      });
      return null;
    }
  },
});

/**
 * Step 2: Installs the platform toolchain (apt packages, Docker, Node CLIs, etc.).
 */
export const installToolchain = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    let sandbox: Sandbox;
    try {
      sandbox = await getExperimentalSandbox(ctx, args.repoId, args.sandboxId);
    } catch (error) {
      await failBuildAndCleanup(
        ctx,
        args.buildId,
        args.repoId,
        args.sandboxId,
        `Failed to get sandbox: ${errorMessage(error)}`,
      );
      return false;
    }

    try {
      const rootSteps = [
        {
          label: "Install base packages",
          command:
            "apt-get update && apt-get install -y git curl jq ripgrep fd-find git-lfs gh sudo wget gnupg",
        },
        {
          label: "Install desktop packages",
          command:
            "apt-get install -y xvfb xfce4 xfce4-terminal x11vnc novnc dbus-x11 x11-utils libx11-6 libxrandr2 libxext6 libxrender1 libxfixes3 libxss1 libxtst6 libxi6",
        },
        {
          label: "Configure IPv4 and DNS",
          command:
            "sed -i 's/mdns4_minimal \\[NOTFOUND=return\\] //' /etc/nsswitch.conf && echo 'precedence ::ffff:0:0/96 100' > /etc/gai.conf",
        },
        {
          label: "Install Chrome",
          command:
            'wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && apt-get update && apt-get install -y google-chrome-stable',
        },
        {
          label: "Install Docker",
          command: "curl -fsSL https://get.docker.com | VERSION=28.3.3 sh",
        },
        {
          label: "Configure Docker",
          command:
            'mkdir -p /etc/docker && echo \'{"dns":["1.1.1.1","8.8.8.8"],"mtu":1400,"ipv6":false,"ip6tables":false,"max-concurrent-downloads":3}\' > /etc/docker/daemon.json',
        },
        {
          label: "Create eva user",
          command:
            "id eva >/dev/null 2>&1 || useradd -m -s /bin/bash eva && usermod -aG docker eva && mkdir -p /workspace /tmp/repo /home/eva/.pnpm /home/eva/.local/bin && chown -R eva:eva /workspace /tmp/repo /home/eva",
        },
        {
          label: "Configure sudo and shell env",
          command:
            `printf %s ${EVA_SUDOERS_B64}|base64 -d>/etc/sudoers.d/eva&&chmod 440 /etc/sudoers.d/eva&&` +
            `printf '%s\\n' 'export PNPM_HOME=${SNAPSHOT_ENV.PNPM_HOME}' 'export NODE_PATH=${SNAPSHOT_ENV.NODE_PATH}' 'export PATH=${SNAPSHOT_ENV.PATH}' 'export SUPABASE_INTERNAL_IMAGE_REGISTRY=${SNAPSHOT_ENV.SUPABASE_INTERNAL_IMAGE_REGISTRY}' >/etc/profile.d/eva-snapshot-env.sh`,
        },
        {
          label: "Enable Node tooling",
          command:
            "corepack enable && ln -sf /usr/bin/fdfind /usr/local/bin/fd && git lfs install --system",
        },
        {
          label: "Install global CLIs",
          command:
            "npm install -g @anthropic-ai/claude-code @openai/codex opencode-ai agent-browser convex",
        },
        {
          label: "Install code-server",
          command: "curl -fsSL https://code-server.dev/install.sh | sh",
        },
        {
          label: "Install Supabase CLI",
          command:
            "curl -fsSL https://github.com/supabase/cli/releases/download/v2.90.0/supabase_2.90.0_linux_amd64.deb -o /tmp/supabase.deb && dpkg -i /tmp/supabase.deb && rm /tmp/supabase.deb",
        },
        {
          label: "Clean apt caches",
          command: "rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*",
        },
      ];

      for (const step of rootSteps) {
        await runSnapshotStep(
          ctx,
          args.buildId,
          sandbox,
          step.label,
          rootCommand(step.command),
          TOOLING_TIMEOUT_SECONDS,
        );
      }

      const evaSteps = [
        {
          label: "Install Cursor CLI",
          command: "curl -fsS https://cursor.com/install | bash",
        },
        {
          label: "Install Claude plugins",
          command:
            "mkdir -p /home/eva/.claude/plugins/marketplaces && " +
            "git clone --depth 1 https://github.com/anthropics/claude-plugins-official.git /home/eva/.claude/plugins/marketplaces/claude-plugins-official && " +
            "git clone --depth 1 https://github.com/Dammyjay93/interface-design.git /home/eva/.claude/plugins/marketplaces/Dammyjay93 && " +
            "git clone --depth 1 https://github.com/SkillPanel/maister.git /home/eva/.claude/plugins/marketplaces/maister-plugins && " +
            `echo '${JSON.stringify({
              enabledPlugins: {
                "frontend-design@claude-plugins-official": true,
                "superpowers@claude-plugins-official": true,
                "context7@claude-plugins-official": true,
                "interface-design@Dammyjay93": true,
                "maister@maister-plugins": true,
              },
            })}' > /home/eva/.claude/settings.json`,
        },
      ];

      for (const step of evaSteps) {
        await runSnapshotStep(
          ctx,
          args.buildId,
          sandbox,
          step.label,
          evaCommand(step.command),
          TOOLING_TIMEOUT_SECONDS,
        );
      }

      return true;
    } catch (error) {
      await failBuildAndCleanup(
        ctx,
        args.buildId,
        args.repoId,
        args.sandboxId,
        `Toolchain install failed: ${errorMessage(error)}`,
      );
      return false;
    }
  },
});

/**
 * Step 3: Downloads config files and clones the repo with dependencies.
 */
export const cloneRepoAndInstallDeps = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    branch: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    let sandbox: Sandbox;
    try {
      sandbox = await getExperimentalSandbox(ctx, args.repoId, args.sandboxId);
    } catch (error) {
      await failBuildAndCleanup(
        ctx,
        args.buildId,
        args.repoId,
        args.sandboxId,
        `Failed to get sandbox: ${errorMessage(error)}`,
      );
      return false;
    }

    try {
      // Install config files
      const configFiles = await ctx.runQuery(
        internal.sandboxConfigFiles.getConfigFilesForSnapshot,
        { repoId: args.repoId },
      );

      await runSnapshotStep(
        ctx,
        args.buildId,
        sandbox,
        "Prepare sandbox config directory",
        evaCommand(
          "mkdir -p /home/eva/sandbox-config && ln -sfn /home/eva/sandbox-config /tmp/sandbox-config",
        ),
        30,
      );

      for (const file of configFiles) {
        if (file.url === null) continue;
        const target = `/home/eva/sandbox-config/${file.fileName}`;
        await runSnapshotStep(
          ctx,
          args.buildId,
          sandbox,
          `Download config file ${file.fileName}`,
          evaCommand(
            `curl -fSL --retry 3 --retry-delay 5 -o ${quote([target])} ${quote([file.url])} && ls -lh ${quote([target])}`,
          ),
          300,
        );
      }

      // Clone repo and install deps
      const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
        repoId: args.repoId,
      });
      if (!repo) {
        throw new Error("GitHub repo not found");
      }

      const appSlug = process.env.GITHUB_APP_SLUG;
      const botUserId = process.env.GITHUB_BOT_USER_ID;
      if (!appSlug || !botUserId) {
        throw new Error(
          "GITHUB_APP_SLUG and GITHUB_BOT_USER_ID must be set in Convex env",
        );
      }

      const token = await getInstallationToken(repo.installationId);
      const repoUrl = buildGitHubRepoUrl(repo.owner, repo.name, token);
      const gitConfig =
        `git config --global user.name ${quote([`${appSlug}[bot]`])} && ` +
        `git config --global user.email ${quote([`${botUserId}+${appSlug}[bot]@users.noreply.github.com`])}`;

      await runSnapshotStep(
        ctx,
        args.buildId,
        sandbox,
        "Configure git identity",
        evaCommand(gitConfig),
        30,
      );

      await runSnapshotStep(
        ctx,
        args.buildId,
        sandbox,
        `Clone ${repo.owner}/${repo.name} ${args.branch}`,
        evaCommand(
          `rm -rf /tmp/repo && git clone --branch ${quote([args.branch])} ${quote([repoUrl])} /tmp/repo`,
        ),
        REPO_CLONE_TIMEOUT_SECONDS,
      );

      await runSnapshotStep(
        ctx,
        args.buildId,
        sandbox,
        "Install repo dependencies",
        evaCommand("cd /tmp/repo && pnpm install --frozen-lockfile"),
        PNPM_INSTALL_TIMEOUT_SECONDS,
      );

      return true;
    } catch (error) {
      await failBuildAndCleanup(
        ctx,
        args.buildId,
        args.repoId,
        args.sandboxId,
        `Clone/install failed: ${errorMessage(error)}`,
      );
      return false;
    }
  },
});

/**
 * Step 4: Runs startup commands that must complete before snapshotting.
 */
export const runStartupCommands = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    startupCommands: v.optional(v.array(v.string())),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!args.startupCommands || args.startupCommands.length === 0) {
      await appendBuildLog(
        ctx,
        args.buildId,
        "No startup commands configured.\n",
      );
      return true;
    }

    let sandbox: Sandbox;
    try {
      sandbox = await getExperimentalSandbox(ctx, args.repoId, args.sandboxId);
    } catch (error) {
      await failBuildAndCleanup(
        ctx,
        args.buildId,
        args.repoId,
        args.sandboxId,
        `Failed to get sandbox: ${errorMessage(error)}`,
      );
      return false;
    }

    try {
      await runSnapshotStep(
        ctx,
        args.buildId,
        sandbox,
        "Start Docker daemon",
        rootCommand(
          "pkill -9 containerd 2>/dev/null || true; pkill -9 dockerd 2>/dev/null || true; sleep 1; rm -f /var/run/docker.sock /var/run/docker/containerd/containerd.sock 2>/dev/null || true; dockerd >/dev/null 2>&1 & sleep 4 && docker info >/dev/null 2>&1",
        ),
        30,
      );

      for (const [index, command] of args.startupCommands.entries()) {
        await runSnapshotStep(
          ctx,
          args.buildId,
          sandbox,
          `Startup command ${index + 1}/${args.startupCommands.length}`,
          evaCommand(`cd /tmp/repo && ${command}`),
          STARTUP_COMMAND_TIMEOUT_SECONDS,
          "/tmp/repo",
        );
      }

      await runSnapshotStep(
        ctx,
        args.buildId,
        sandbox,
        "Mark startup commands complete",
        evaCommand("touch /tmp/.startup-commands-done"),
        30,
      );

      return true;
    } catch (error) {
      await failBuildAndCleanup(
        ctx,
        args.buildId,
        args.repoId,
        args.sandboxId,
        `Startup commands failed: ${errorMessage(error)}`,
      );
      return false;
    }
  },
});

/**
 * Step 5: Creates the live snapshot and deletes the builder sandbox.
 */
export const finalizeSnapshot = internalAction({
  args: {
    buildId: v.id("snapshotBuilds"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    snapshotName: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    let sandbox: Sandbox;
    try {
      sandbox = await getExperimentalSandbox(ctx, args.repoId, args.sandboxId);
    } catch (error) {
      await failBuildAndCleanup(
        ctx,
        args.buildId,
        args.repoId,
        args.sandboxId,
        `Failed to get sandbox: ${errorMessage(error)}`,
      );
      return false;
    }

    try {
      await appendBuildLog(
        ctx,
        args.buildId,
        `Creating live snapshot ${args.snapshotName} from builder sandbox.\n`,
      );
      await sandbox._experimental_createSnapshot(
        args.snapshotName,
        CREATE_SNAPSHOT_TIMEOUT_SECONDS,
      );

      await ctx.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "success",
        logs: "Live snapshot created successfully.\n",
      });

      // Clean up builder sandbox
      try {
        await appendBuildLog(
          ctx,
          args.buildId,
          `Deleting builder sandbox ${args.sandboxId}.\n`,
        );
        await sandbox.delete();
      } catch (cleanupError) {
        await appendBuildLog(
          ctx,
          args.buildId,
          `Sandbox cleanup warning: ${errorMessage(cleanupError)}\n`,
        );
      }

      return true;
    } catch (error) {
      await failBuildAndCleanup(
        ctx,
        args.buildId,
        args.repoId,
        args.sandboxId,
        `Snapshot creation failed: ${errorMessage(error)}`,
      );
      return false;
    }
  },
});

/**
 * Workflow step 0: Deletes the existing snapshot and waits for removal to complete.
 * daytona.snapshot.delete() returns immediately but the snapshot enters a removing
 * state, so recreating the same name can conflict until removal finishes.
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

    const daytona = getExperimentalDaytona(daytonaApiKey);

    try {
      const existing = await daytona.snapshot.get(args.snapshotName);
      await daytona.snapshot.delete(existing);

      await ctx.runMutation(internal.repoSnapshots.appendLogs, {
        buildId: args.buildId,
        chunk: "Deleting existing snapshot, waiting for removal...\n",
      });

      for (let i = 0; i < 30; i++) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 2000);
        });
        try {
          await daytona.snapshot.get(args.snapshotName);
        } catch {
          break;
        }
      }
    } catch {
      // Snapshot does not exist.
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

    const daytona = getExperimentalDaytona(daytonaApiKey);
    try {
      const snapshot = await daytona.snapshot.get(args.snapshotName);
      await daytona.snapshot.delete(snapshot);
    } catch {
      // Snapshot may not exist.
    }
    return null;
  },
});
