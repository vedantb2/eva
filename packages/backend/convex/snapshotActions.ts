"use node";

import { v } from "convex/values";
import { z } from "zod";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveSandboxCredentials } from "./envVarResolver";
import { getInstallationToken } from "./githubAuth";
import {
  buildConfigFileDownloadCommands,
  filterDownloadableConfigFiles,
  execHandle,
  getSandboxHandle,
  type SandboxConfigFile,
} from "./_sandbox_runtime/helpers";
import {
  createSandboxAndPrepareRepo,
  SESSION_LIFECYCLE,
} from "./_sandbox_runtime/git";
import { getSandboxClient } from "./_sandbox/factory";
import {
  buildConvexBackgroundScriptBody,
  isConvexBackendCommand,
} from "./_sandbox_runtime/convexLocalBackend";
import { Sandbox, Snapshot } from "@vercel/sandbox";
import { SANDBOX_TAG } from "./_sandbox/tags";

const SEED_PREP_LABEL_KEY = SANDBOX_TAG.purpose;
const SEED_PREP_LABEL_VALUE = "snapshot-seed-prep";

/** Boundary schema for GitHub contents API lockfile SHA lookups. */
const shaResponseSchema = z.object({ sha: z.string() });

// Pinned Supabase CLI version installed on fresh Vercel sandboxes (no base
// Image toolchain baked in).
const SUPABASE_CLI_VERSION = "2.90.0";

function shouldCaptureSupabaseState(commands: string[]): boolean {
  return commands.some((command) => {
    const lower = command.toLowerCase();
    return (
      lower.includes("supabase") ||
      lower.includes("start-db") ||
      lower.includes("seed:sql")
    );
  });
}

function seededRuntimeStateCaptureLines(
  requireSupabaseDump: boolean,
): string[] {
  return [
    'echo "SEEDRUN-STAGE:capture-runtime-state"',
    `REQUIRE_SUPABASE_DUMP=${requireSupabaseDump ? "1" : "0"}`,
    "mkdir -p /home/eva/.eva-snapshot-state",
    "rm -f /home/eva/.eva-snapshot-state/supabase-db-web.pg_dump.sql.gz",
    'if [ "$REQUIRE_SUPABASE_DUMP" != "1" ]; then',
    '  echo "repo does not require Supabase state capture; skipping"',
    "elif ! docker ps --filter name=supabase_db_web --filter status=running -q | grep -q .; then",
    // Fall back to a from-scratch start when `docker start` fails — a warm
    // prep sandbox can carry a half-cleaned docker state (stopped container
    // whose network was pruned by a prior `supabase stop`).
    "  if ! { docker ps -a --filter name=supabase_db_web -q | grep -q . && docker start supabase_db_web >/dev/null 2>&1; }; then",
    "    docker ps -aq --filter name=supabase | xargs -r docker rm -f",
    "    ( cd /tmp/repo && pnpm start-db ) || true",
    "  fi",
    "fi",
    'if [ "$REQUIRE_SUPABASE_DUMP" = "1" ]; then',
    "  for i in $(seq 1 240); do docker exec supabase_db_web pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done",
    '  docker exec supabase_db_web pg_isready -U postgres >/dev/null 2>&1 || { echo "SEEDRUN-FAILED:capture-runtime-state"; exit 1; }',
    "  dump_supabase_public_data() { ( set -o pipefail; docker exec supabase_db_web pg_dump -U postgres -d postgres --schema=public --data-only --no-owner --no-privileges | gzip -1 > /home/eva/.eva-snapshot-state/supabase-db-web.pg_dump.sql.gz ); }",
    "  count_supabase_dump_rows() { gzip -dc /home/eva/.eva-snapshot-state/supabase-db-web.pg_dump.sql.gz | awk 'BEGIN{in_copy=0;c=0} /^COPY public\\./{in_copy=1;next} /^\\\\\\.$/{in_copy=0;next} in_copy{c++} END{print c}'; }",
    '  dump_supabase_public_data || { echo "SEEDRUN-FAILED:capture-runtime-state"; exit 1; }',
    "  SUPABASE_DUMP_ROWS=$(count_supabase_dump_rows)",
    '  if [ "$SUPABASE_DUMP_ROWS" = "0" ] && [ -f packages/db/data.sql ]; then echo "Supabase dump was empty; rerunning pnpm seed:sql before capture"; pnpm seed:sql || { echo "SEEDRUN-FAILED:capture-runtime-state"; exit 1; }; dump_supabase_public_data || { echo "SEEDRUN-FAILED:capture-runtime-state"; exit 1; }; SUPABASE_DUMP_ROWS=$(count_supabase_dump_rows); fi',
    '  if [ "$SUPABASE_DUMP_ROWS" = "0" ]; then echo "SEEDRUN-FAILED:capture-runtime-state"; exit 1; fi',
    '  echo "supabase_dump_rows=$SUPABASE_DUMP_ROWS"',
    "  ls -lh /home/eva/.eva-snapshot-state/supabase-db-web.pg_dump.sql.gz",
    "fi",
  ];
}

// Bump when the Vercel base-image toolchain inputs change so fingerprints
// invalidate and the next build rebuilds even if repo/config inputs are unchanged.
const IMAGE_DEF_VERSION = 1;

/** Fingerprint of Image inputs used to skip redundant base rebuilds. */
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
          const parsed = shaResponseSchema.safeParse(await resp.json());
          if (parsed.success) {
            lockfileSha = parsed.data.sha;
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
    // Branch to hard-reset /tmp/repo to (refs must already be fetched — the
    // workflow runs sandbox.fetchBaseBranch first, which owns git auth).
    branch: v.string(),
    // Repo build commands (pnpm install / codegen etc), run after the reset so
    // the captured snapshot carries fresh node_modules and build artifacts.
    buildCommands: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const startupCommands: string[] | null = await ctx.runQuery(
      internal.repoSnapshots.getStartupCommands,
      { repoId: args.repoId },
    );
    const backgroundCommands: string[] | null = await ctx.runQuery(
      internal.repoSnapshots.getBackgroundCommands,
      { repoId: args.repoId },
    );
    const stopCommands: string[] | null = await ctx.runQuery(
      internal.repoSnapshots.getStopCommands,
      { repoId: args.repoId },
    );
    const requireSupabaseDump = shouldCaptureSupabaseState([
      ...(startupCommands ?? []),
      ...(backgroundCommands ?? []),
      ...(stopCommands ?? []),
    ]);
    const lines: string[] = [
      "#!/bin/bash",
      "exec > /tmp/seedrun.log 2>&1",
      "set -x",
      "rm -f /tmp/.seedrun-done",
    ];
    // Vercel has no custom base Image: a fresh sandbox boots bare node with
    // none of the agent CLIs installed. Install them once on the seed-prep
    // sandbox so triggerSeededSnapshot bakes them into the snap_* capture.
    {
      lines.push(        'echo "SEEDRUN-STAGE:toolchain"',
        // Staging dirs eva's commands hardcode as /home/eva/... — the Vercel
        // sandbox user is not literally "eva", so pre-create + open them up.
        "sudo mkdir -p /home/eva/sandbox-config /home/eva/.eva-snapshot-state && sudo chmod -R 777 /home/eva",
        'sudo dnf install -y docker git jq gzip tar procps-ng psmisc tigervnc-server python3 python3-pip xorg-x11-utils xterm dbus-x11 || { echo "SEEDRUN-FAILED:toolchain-dnf"; exit 1; }',
        "sudo dnf install -y gtk3 nss alsa-lib libXtst at-spi2-core libdrm mesa-libgbm libxkbcommon libXdamage libXcomposite libXrandr libXcursor libXinerama cups-libs >/tmp/desktop-gui-dnf.log 2>&1 || true",
        // Start dockerd detached and wait for it to come up.
        'sudo setsid dockerd </dev/null >/tmp/dockerd.log 2>&1 & for i in $(seq 1 60); do docker info >/dev/null 2>&1 && break; sleep 1; done; sudo chmod 666 /var/run/docker.sock 2>/dev/null || true; docker info >/dev/null 2>&1 || { echo "SEEDRUN-FAILED:docker-start"; exit 1; }',
        'corepack enable || sudo corepack enable || { echo "SEEDRUN-FAILED:corepack"; exit 1; }',
        'corepack prepare pnpm@10.33.4 --activate || { echo "SEEDRUN-FAILED:pnpm"; exit 1; }',
        "git config --global --add safe.directory '*'",
        // Pinned Supabase CLI (tarball — same pinned version as the base Image's .deb install).
        `command -v supabase >/dev/null 2>&1 || { curl -fsSL https://github.com/supabase/cli/releases/download/v${SUPABASE_CLI_VERSION}/supabase_linux_amd64.tar.gz -o /tmp/sb.tgz && sudo tar -xzf /tmp/sb.tgz -C /usr/local/bin supabase; } || { echo "SEEDRUN-FAILED:supabase-cli"; exit 1; }`,
        'sudo npm install -g @anthropic-ai/claude-code @openai/codex opencode-ai agent-browser convex agentation-mcp@1.2.0 || { echo "SEEDRUN-FAILED:agent-clis"; exit 1; }',
        'curl -fsSL https://code-server.dev/install.sh | sh || { echo "SEEDRUN-FAILED:code-server"; exit 1; }',
        'python3 -m pip install --user --break-system-packages websockify >/tmp/websockify-pip.log 2>&1 || python3 -m pip install --user websockify >/tmp/websockify-pip.log 2>&1 || { echo "SEEDRUN-FAILED:websockify"; exit 1; }',
        "sudo ln -sf $(python3 -m site --user-base)/bin/websockify /usr/local/bin/websockify || true",
        // Canonical path matches vercel-sandbox-gui + VercelDesktop (/opt/novnc).
        // Amazon Linux has no openbox/fluxbox packages — Chrome runs on Xvnc
        // without a WM (same as the GUI reference).
        'sudo rm -rf /opt/novnc /opt/noVNC && sudo git clone --depth 1 https://github.com/novnc/noVNC.git /opt/novnc || { echo "SEEDRUN-FAILED:novnc"; exit 1; }',
        "sudo tee /etc/yum.repos.d/google-chrome.repo >/dev/null <<'EOF'\n[google-chrome]\nname=google-chrome\nbaseurl=https://dl.google.com/linux/chrome/rpm/stable/x86_64\nenabled=1\ngpgcheck=1\ngpgkey=https://dl.google.com/linux/linux_signing_key.pub\nEOF",
        'sudo dnf install -y google-chrome-stable >/tmp/chrome-dnf.log 2>&1 || sudo dnf install -y chromium >/tmp/chromium-dnf.log 2>&1 || { echo "SEEDRUN-FAILED:chrome"; exit 1; }',
        'curl -fsS https://cursor.com/install -o /tmp/cursor-install.sh && HOME=/home/eva bash /tmp/cursor-install.sh >/tmp/cursor.log 2>&1 || { echo "SEEDRUN-FAILED:cursor"; exit 1; }',
        "if [ ! -x /home/eva/.local/bin/cursor-agent ] && [ -x /home/eva/.local/bin/agent ]; then ln -sf /home/eva/.local/bin/agent /home/eva/.local/bin/cursor-agent; fi",
        "sudo ln -sf /home/eva/.local/bin/cursor-agent /usr/local/bin/cursor-agent || true",
        "mkdir -p /home/eva/.claude/plugins/marketplaces",
        'git clone --depth 1 https://github.com/anthropics/claude-plugins-official.git /home/eva/.claude/plugins/marketplaces/claude-plugins-official || { echo "SEEDRUN-FAILED:claude-plugins"; exit 1; }',
        'git clone --depth 1 https://github.com/Dammyjay93/interface-design.git /home/eva/.claude/plugins/marketplaces/Dammyjay93 || { echo "SEEDRUN-FAILED:interface-design-plugin"; exit 1; }',
        'git clone --depth 1 https://github.com/SkillPanel/maister.git /home/eva/.claude/plugins/marketplaces/maister-plugins || { echo "SEEDRUN-FAILED:maister-plugin"; exit 1; }',
        `echo '{"enabledPlugins":{"frontend-design@claude-plugins-official":true,"superpowers@claude-plugins-official":true,"context7@claude-plugins-official":true,"interface-design@Dammyjay93":true,"maister@maister-plugins":true}}' > /home/eva/.claude/settings.json`,
        // Persist PATH additions into the sandbox filesystem itself (not just
        // the current shell) so agent CLIs survive into the captured snap_*
        // and are found by every later session exec:
        //   - /etc/profile.d runs for every `bash -lc` login-shell exec (see
        //     SOURCE_ENV / exec() in vercelProvider.ts) — the durable fix.
        //   - .bashrc/.eva-env.sh are best-effort belt-and-suspenders; note
        //     .eva-env.sh gets fully REWRITTEN by every session create() with
        //     that session's env vars (vercelProvider.ts renderEnvFile), so
        //     /etc/profile.d is what actually has to carry this across boots.
        'echo "SEEDRUN-STAGE:path-setup"',
        "echo 'export PATH=\"/home/eva/.local/bin:/usr/local/bin:$PATH\"' | sudo tee /etc/profile.d/eva-path.sh >/dev/null && sudo chmod 644 /etc/profile.d/eva-path.sh",
        "echo 'export PATH=\"/home/eva/.local/bin:/usr/local/bin:$PATH\"' >> /home/eva/.bashrc",
        "echo 'export PATH=\"/home/eva/.local/bin:/usr/local/bin:$PATH\"' >> /vercel/sandbox/.eva-env.sh",
      );

      // Config files (data.sql, backup zips) are NOT baked into a fresh Vercel
      // sandbox the way they are into the base Image — download them here so
      // the update stage below can copy them into /tmp/repo before install.
      const configFiles: SandboxConfigFile[] = await ctx.runQuery(
        internal.sandboxConfigFiles.getConfigFilesForSnapshot,
        { repoId: args.repoId },
      );
      const downloadableFiles = filterDownloadableConfigFiles(configFiles);
      if (downloadableFiles.length > 0) {
        lines.push('echo "SEEDRUN-STAGE:config-files"');
        downloadableFiles.forEach((file, i) => {
          const commands = buildConfigFileDownloadCommands(
            file,
            "/home/eva/sandbox-config",
          );
          commands.forEach((command) => {
            lines.push(
              `( ${command} ) || { echo "SEEDRUN-FAILED:config-${i}"; exit 1; }`,
            );
          });
        });
      }
    }
    // ---- update: latest code + fresh deps/artifacts ----
    lines.push(
      'echo "SEEDRUN-STAGE:update"',
      'cd /tmp/repo || { echo "SEEDRUN-FAILED:no-repo"; exit 1; }',
      `( git checkout -f ${args.branch} 2>/dev/null || git checkout -fb ${args.branch} origin/${args.branch} ) && git reset --hard origin/${args.branch} || { echo "SEEDRUN-FAILED:git-reset"; exit 1; }`,
    );
    lines.push(
      // Mirror config files into the repo tree (staged outside so they survive git clean).
      "cp -a /home/eva/sandbox-config/. /tmp/repo/ 2>/dev/null || true",
      'echo "SEEDRUN-STAGE:install"',
      'pnpm install --frozen-lockfile || { echo "SEEDRUN-FAILED:install"; exit 1; }',
    );
    // Vercel node24 base has no container runtime. Install Docker if missing,
    // then ensure the daemon is running and the socket is group-accessible so
    // startup/background commands can run `docker ps` without sudo. Kept as a
    // defensive re-check even though the toolchain stage above already starts
    // dockerd — idempotent, so harmless when it is already running.
    lines.push(
      'echo "SEEDRUN-STAGE:docker-bootstrap"',
      // Install Docker if not already present (skip on warm snapshots that
      // already have it baked in).
      'command -v docker >/dev/null 2>&1 || { sudo dnf install -y docker 2>&1 || { echo "SEEDRUN-FAILED:docker-install"; exit 1; }; }',
      // Ensure daemon is running (Vercel does not auto-start dockerd on restore).
      'sudo docker info >/dev/null 2>&1 || sudo systemctl start docker 2>&1 || { echo "SEEDRUN-FAILED:docker-start"; exit 1; }',
      // Open the socket so non-root `docker` commands work (background/startup
      // commands run as the sandbox user without sudo).
      "sudo chmod 666 /var/run/docker.sock 2>/dev/null || true",
      // Block until the daemon is fully ready.
      "until docker info >/dev/null 2>&1; do sleep 1; done",
    );    args.buildCommands.forEach((command, i) => {
      lines.push(
        `( ${command} ) || { echo "SEEDRUN-FAILED:build-${i}"; exit 1; }`,
      );
    });
    // ---- daemons: launch each background command detached (b64 per command
    // so quoting inside user commands can never break the script) ----
    lines.push('echo "SEEDRUN-STAGE:daemons"');
    (backgroundCommands ?? []).forEach((command, i) => {
      // Convex daemons need the same plant/agent-mode wrapper as
      // runBackgroundCommands (anonymous CLI rejects --local-backend-version).
      const scriptBody = isConvexBackendCommand(command)
        ? buildConvexBackgroundScriptBody(command)
        : command;
      const cb64 = Buffer.from(scriptBody, "utf8").toString("base64");
      lines.push(
        `echo ${cb64} | base64 -d > /tmp/bg-cmd-${i}.sh && chmod +x /tmp/bg-cmd-${i}.sh && setsid nohup bash -l /tmp/bg-cmd-${i}.sh </dev/null > /tmp/bg-${i}.log 2>&1 &`,
      );
    });
    // ---- seed ----
    lines.push('echo "SEEDRUN-STAGE:startup"');
    (startupCommands ?? []).forEach((command, i) => {
      // Subshell so `cd`/env in one command can't leak into the next, matching
      // how runSandboxCommand executed them as separate execs.
      lines.push(
        `( ${command} ) || { echo "SEEDRUN-FAILED:startup-${i}"; exit 1; }`,
      );
    });
    lines.push(...seededRuntimeStateCaptureLines(requireSupabaseDump));
    // Marker so a sandbox booting from the captured snapshot skips the seed.
    lines.push("touch /tmp/.startup-commands-done");
    (stopCommands ?? []).forEach((command, i) => {
      lines.push(
        `( ${command} ) || { echo "SEEDRUN-FAILED:stop-${i}"; exit 1; }`,
      );
    });
    lines.push('echo "SEEDRUN-DONE"', "touch /tmp/.seedrun-done");
    const script = lines.join("\n");
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    // Process-based guard makes the launch idempotent so the workflow can
    // retry a timed-out launch exec without racing a second copy. It must be
    // the LIVE process (pgrep, self-match-proof bracket pattern), not a
    // lockfile: a prep sandbox warm-booted from a previously captured seeded
    // snapshot carries that capture's marker files baked into /tmp, and a
    // file-based guard would skip the launch and instantly report the baked
    // "done" — capturing without ever re-seeding. Stale markers are scrubbed
    // before every fresh launch for the same reason.
    const alreadyRunning = await execHandle(
      sandbox,
      'pgrep -f "[s]eedrun.sh" >/dev/null && echo ALREADY-RUNNING || echo NOT-RUNNING',
      30,
    );
    if (!alreadyRunning.includes("ALREADY-RUNNING")) {
      // Never inline the script as base64 in a shell command — carepulse's
      // startup/background arrays make the payload far larger than ARG_MAX.
      // Use the provider writeFile API (Vercel writeFiles / provider upload).
      await execHandle(
        sandbox,
        "rm -f /tmp/.seedrun-done /tmp/seedrun.log /tmp/seedrun.sh",
        30,
      );
      await sandbox.writeFile("/tmp/seedrun.sh", script);
      await execHandle(sandbox, "chmod +x /tmp/seedrun.sh", 30);
      const wrote = await execHandle(
        sandbox,
        "test -s /tmp/seedrun.sh && echo WROTE || echo WRITE-FAILED",
        30,
      );
      if (!wrote.includes("WROTE")) {
        throw new Error("Failed to write /tmp/seedrun.sh to the prep sandbox");
      }
      await sandbox.execDetached("/tmp/seedrun.sh");
    }
    return null;
  },
});

/**
 * Seeded-snapshot build — DIAGNOSTICS step. Returns the tail of the seed-run
 * log and background daemon logs so a failed seed can be appended to the build
 * record BEFORE the prep sandbox is torn down (teardown destroys the evidence).
 */
export const fetchSeedDiagnostics = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    try {
      return await execHandle(
        sandbox,
        [
          'echo "== git state =="',
          "( cd /tmp/repo && git rev-parse --short HEAD 2>&1; git status -s 2>&1 | head -5 )",
          'echo "== convex versions =="',
          "( cd /tmp/repo && npx convex --version 2>&1; ls -la ~/.convex/ 2>&1 | head; ls -la ~/.cache/convex/ 2>&1 | head )",
          'echo "== 3210 listening? =="',
          "curl -s -o /dev/null -w 'backend http:%{http_code}\\n' http://127.0.0.1:3210 2>&1 || echo '3210 unreachable'",
          'echo "== seedrun.log (tail) =="; tail -c 4000 /tmp/seedrun.log 2>/dev/null',
          'for f in /tmp/bg-*.log; do echo; echo "== $f =="; tail -c 3000 "$f" 2>/dev/null; done',
          "true",
        ].join("; "),
        90,
      );
    } catch (e) {
      return `diagnostics unavailable: ${e instanceof Error ? e.message : String(e)}`;
    }
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
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    const out = await execHandle(
      sandbox,
      [
        "test -f /tmp/.seedrun-done && echo DONE",
        'grep -aoE "SEEDRUN-FAILED:[a-z0-9-]+" /tmp/seedrun.log 2>/dev/null | tail -1',
        "test -f /tmp/seedrun.sh || echo NO-SCRIPT",
        'pgrep -f "[s]eedrun.sh" >/dev/null || echo NO-PROC',
        "true",
      ].join("; "),
      30,
    );
    if (out.includes("DONE")) return "done";
    const failed = out.match(/SEEDRUN-FAILED:([a-z0-9-]+)/);
    if (failed) return `failed:${failed[1]}`;
    if (out.includes("NO-SCRIPT")) return "failed:no-script";
    // Script file exists but process died without writing done/failed markers.
    if (out.includes("NO-PROC") && !out.includes("DONE")) {
      const hasLog = await execHandle(
        sandbox,
        "test -s /tmp/seedrun.log && echo HAS-LOG || echo NO-LOG",
        15,
      );
      if (hasLog.includes("NO-LOG")) return "failed:exited-no-log";
    }
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
    const { credentials, sandboxEnvVars } = await resolveSandboxCredentials(
      ctx,
      args.repoId,
    );
    const client = getSandboxClient(credentials);
    // Only `snap_*` ids are valid Vercel snapshot sources. Legacy
    // names (`snapshot-*` / `seeded-*`) 404 on Vercel — fall back to a fresh
    // sandbox so the first Vercel build can bootstrap by cloning from scratch.
    const effectiveImageSnapshot = args.imageSnapshot.startsWith("snap_")
      ? args.imageSnapshot
      : undefined;
    const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
      repoId: args.repoId,
    });
    if (!repo) throw new Error("Repo not found");
    const seedPrepLifecycle = {
      ...SESSION_LIFECYCLE,
      labels: {
        [SEED_PREP_LABEL_KEY]: SEED_PREP_LABEL_VALUE,
        [SANDBOX_TAG.repoId]: args.repoId,
      },
    };
    const { sandbox } = await createSandboxAndPrepareRepo(
      ctx,
      client,
      repo.installationId,
      repo.owner,
      repo.name,
      { ...sandboxEnvVars, REPO_ID: args.repoId },
      seedPrepLifecycle,
      effectiveImageSnapshot,
      undefined, // volumes
      undefined, // onSandboxAcquired
      undefined, // onProgress
      { mode: "all" }, // syncStrategy
      // Large seeded snapshots take well over the 30s default to boot; 180s
      // avoids the spurious create timeout + orphaned sandbox on warm boots.
      180,
      // Skip pnpm/yarn install: launchSeedRun's buildCommands install deps
      // inside the detached seed script. Installing here would blow Convex's
      // 600s per-action ceiling on providers (Vercel) that don't have deps
      // pre-baked into their base snapshot.
      true,
    );
    return { sandboxId: sandbox.id };
  },
});

/**
 * Provider-agnostic delete of a seed-prep sandbox. Used by the snapshot build
 * workflow after the seed run completes (success or failure) so the sandbox does
 * not linger. Works for the Vercel provider.
 */
export const deleteSeedPrepSandbox = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    sandboxId: v.string(),
    /** Keep this snap_* when tearing down the prep sandbox (successful seed). */
    preserveSnapshotId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const { credentials } = await resolveSandboxCredentials(ctx, args.repoId);
    const client = getSandboxClient(credentials);
    try {
      const handle = await client.get(args.sandboxId);
      await handle.delete({
        preserveSnapshotIds:
          args.preserveSnapshotId !== undefined
            ? [args.preserveSnapshotId]
            : undefined,
      });
    } catch (e) {
      // Best-effort: log but do not fail the build if delete fails.
      console.error(
        `[snapshot] deleteSeedPrepSandbox: failed to delete ${args.sandboxId}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
    return null;
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
 * a short timeout (the snapshot keeps building server-side), then poll
 * completion in separate workflow steps via pollSeededSnapshotState. Any
 * non-timeout error is a real failure and propagates to the per-app fallback.
 */
export const triggerSeededSnapshot = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    sandboxId: v.string(),
    seededName: v.string(),
  },
  // Returns the effective snapshot identifier used by the provider.
  // For Vercel it is the
  // `snap_*` id returned by the API. The workflow must use this value — not
  // seededName — when polling and writing seededSnapshotName to the DB.
  returns: v.object({ snapshotId: v.string() }),
  handler: async (ctx, args): Promise<{ snapshotId: string }> => {
    const { credentials } = await resolveSandboxCredentials(ctx, args.repoId);
    const client = getSandboxClient(credentials);
    const handle = await client.get(args.sandboxId);
    const { snapshotId } = await handle.createSnapshot({
      name: args.seededName,
      timeoutSeconds: SEEDED_SNAPSHOT_TRIGGER_TIMEOUT_SEC,
    });
    return { snapshotId };
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
    const { credentials } = await resolveSandboxCredentials(ctx, args.repoId);
    const client = getSandboxClient(credentials);
    // Not registered yet (or a transient lookup miss) → treat as still pending.
    const snapshot = await client.getSnapshot(args.seededName);
    if (!snapshot) return "pending";
    // SandboxSnapshotInfo.status uses "ready" for success; the workflow polls
    // for "active" (the workflow term). Map "ready" → "active" so the
    // existing isTerminalSnapshotState / state === "active" checks still work.
    return snapshot.status === "ready" ? "active" : snapshot.status;
  },
});

/**
 * Best-effort safety net at the end of every whole-repo seeded-snapshot build:
 * deletes any seed-prep sandbox left behind for the given repos.
 */
export const stopAllRepoSandboxes = internalAction({
  args: { seedableRepoIds: v.array(v.id("githubRepos")) },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    if (args.seedableRepoIds.length === 0) return null;
    const primaryRepoId = args.seedableRepoIds[0];
    try {
      const { credentials } = await resolveSandboxCredentials(
        ctx,
        primaryRepoId,
      );
      // Delete every seed-prep sandbox tagged for these repos so none keep
      // running/billing. Filtered STRICTLY by the seed-prep purpose tag +
      // repoId — session/task sandboxes use eva.purpose=persistent|ephemeral
      // and are never matched.
      const seedableSet = new Set<string>(args.seedableRepoIds);
      const list = await Sandbox.list({
        token: credentials.token,
        teamId: credentials.teamId,
        projectId: credentials.projectId,
      });
      const client = getSandboxClient(credentials);
      let deleted = 0;
      for await (const meta of list) {
        const tags: Record<string, string> = meta.tags ?? {};
        if (tags[SEED_PREP_LABEL_KEY] !== SEED_PREP_LABEL_VALUE) continue;
        const sandboxRepoId = tags[SANDBOX_TAG.repoId];
        if (sandboxRepoId === undefined || !seedableSet.has(sandboxRepoId)) {
          continue;
        }
        try {
          const handle = await client.get(meta.name);
          await handle.delete();
          deleted++;
        } catch (err) {
          console.warn(
            `[snapshot] stopAllRepoSandboxes: failed to delete ${meta.name}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
      console.log(
        `[snapshot] stopAllRepoSandboxes: deleted ${deleted} vercel seed-prep sandbox(es)`,
      );
    } catch (e) {
      console.error(
        `[snapshot] stopAllRepoSandboxes: best-effort sweep failed: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
    return null;
  },
});

/**
 * Provider-agnostic delete of a seeded snapshot by its id/name. Resolves the
 * repo credentials and calls the neutral deleteSnapshot, so
 * previous `snap_*` (Vercel) captures don't accumulate
 * — the single-snapshot build makes a fresh capture each run. Best-effort: a
 * missing/foreign-provider snapshot just no-ops (deleteSnapshot returns false).
 */
export const deleteSeededSnapshot = internalAction({
  args: { snapshotName: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    try {
      const { credentials } = await resolveSandboxCredentials(ctx, args.repoId);
      const client = getSandboxClient(credentials);
      const deleted = await client.deleteSnapshot(args.snapshotName);
      // Explicit confirmation so "keep-last" / rebuild deletion can be
      // verified in Convex logs, not just the build's UI log stream.
      console.log(
        deleted
          ? `[snapshot] deleteSeededSnapshot: deleted ${args.snapshotName}`
          : `[snapshot] deleteSeededSnapshot: ${args.snapshotName} not found (already gone)`,
      );
    } catch (e) {
      console.error(
        `[snapshot] deleteSeededSnapshot: failed to delete ${args.snapshotName}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
    return null;
  },
});

/**
 * One-shot / ops cleanup: delete every Vercel snap_* in the project that is not
 * (1) the current base Image / per-app seeded capture, or (2) still owned by an
 * existing sandbox (session / quick-task / project resume snaps). Use after
 * ephemeral automation sandboxes left never-expiring orphans behind. Legacy no-op removed.
 */
export const purgeUnreferencedVercelSnapshots = internalAction({
  args: { repoId: v.id("githubRepos") },
  returns: v.object({
    protectedCount: v.number(),
    liveSandboxCount: v.number(),
    deletedCount: v.number(),
    skippedCount: v.number(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    protectedCount: number;
    liveSandboxCount: number;
    deletedCount: number;
    skippedCount: number;
  }> => {
    const { credentials } = await resolveSandboxCredentials(ctx, args.repoId);
    const creds = {
      token: credentials.token,
      teamId: credentials.teamId,
      projectId: credentials.projectId,
    };
    const protectedIds = new Set(
      await ctx.runQuery(internal.repoSnapshots.listProtectedSnapshotIds, {
        repoId: args.repoId,
      }),
    );

    // Protect resume snaps for every sandbox that still exists — otherwise this
    // purge would wipe session/task/project filesystem state.
    let liveSandboxCount = 0;
    const sandboxes = await Sandbox.list(creds);
    for await (const sandbox of sandboxes) {
      liveSandboxCount += 1;
      const currentId = sandbox.currentSnapshotId;
      if (typeof currentId === "string" && currentId.length > 0) {
        protectedIds.add(currentId);
      }
      const owned = await Snapshot.list({ ...creds, name: sandbox.name });
      for await (const meta of owned) {
        protectedIds.add(meta.id);
      }
    }

    const listed = await Snapshot.list(creds);
    let deletedCount = 0;
    let skippedCount = 0;
    // list() yields plain metadata (`id`, no .delete()) — re-hydrate to delete.
    for await (const meta of listed) {
      if (protectedIds.has(meta.id)) {
        skippedCount += 1;
        continue;
      }
      if (String(meta.status) === "deleted") {
        skippedCount += 1;
        continue;
      }
      try {
        const snap = await Snapshot.get({
          ...creds,
          snapshotId: meta.id,
        });
        await snap.delete();
        deletedCount += 1;
      } catch (error) {
        console.warn(
          `[snapshot] purgeUnreferencedVercelSnapshots: failed ${meta.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    console.log(
      `[snapshot] purgeUnreferencedVercelSnapshots: protected=${protectedIds.size} liveSandboxes=${liveSandboxCount} deleted=${deletedCount} skipped=${skippedCount}`,
    );
    return {
      protectedCount: protectedIds.size,
      liveSandboxCount,
      deletedCount,
      skippedCount,
    };
  },
});
