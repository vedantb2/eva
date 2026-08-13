"use node";

import { createHmac } from "crypto";
import { quote } from "shell-quote";
import { getAIModelProvider, normalizeAIModel } from "../validators";
import type { AIProvider } from "../validators";
import { execHandle, requireEnv } from "./helpers";
import { entityDaemonPaths } from "./daemonPaths";
import type { SandboxHandle } from "../_sandbox/provider";
import { CALLBACK_SCRIPT } from "./callbackScript";
import { CALLBACK_SCRIPT_FINGERPRINT } from "./callbackScriptFingerprint";

// Paths baked into the callback script env for each CLI's config directory.
// These originated as Daytona persistence-volume mount paths; the *_RUNTIME_*
// paths are still where the callback script looks regardless of whether a
// volume is mounted there, so they stay here now that Daytona volumes are gone.
export const CLAUDE_BASE_CONFIG_DIR = "/home/eva/.claude";
export const CLAUDE_RUNTIME_CONFIG_DIR = "/tmp/claude-config";
export const CLAUDE_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.claude-persist";
export const CODEX_RUNTIME_HOME_DIR = "/tmp/codex-home";
export const CODEX_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.codex-persist";
export const OPENCODE_RUNTIME_HOME_DIR = "/tmp/opencode-home";
export const OPENCODE_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.opencode-persist";
export const CURSOR_RUNTIME_HOME_DIR = "/tmp/cursor-home";
export const CURSOR_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.cursor-persist";

const CLAUDE_INSTALL_TIMEOUT_SECONDS = 300;
const CLAUDE_FALLBACK_INSTALL_DIR = "/tmp/claude-cli";
const CLAUDE_FALLBACK_BIN_PATH = `${CLAUDE_FALLBACK_INSTALL_DIR}/bin/claude`;
const CODEX_INSTALL_TIMEOUT_SECONDS = 300;
const CODEX_FALLBACK_INSTALL_DIR = "/tmp/codex-cli";
const CODEX_FALLBACK_BIN_PATH = `${CODEX_FALLBACK_INSTALL_DIR}/bin/codex`;
const OPENCODE_INSTALL_TIMEOUT_SECONDS = 300;
const OPENCODE_FALLBACK_INSTALL_DIR = "/tmp/opencode-cli";
const OPENCODE_FALLBACK_BIN_PATH = `${OPENCODE_FALLBACK_INSTALL_DIR}/bin/opencode`;
const CALLBACK_READY_POLL_ATTEMPTS = 60;
const CALLBACK_READY_POLL_INTERVAL_MS = 1000;
const EVA_ENV_FILE = "/vercel/sandbox/.eva-env.sh";

/** Computes a scoped streaming HMAC if the deployment encryption key is available. */
function computeStreamingHmac(entityId: string): string | null {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) return null;
  return createHmac("sha256", secret).update(entityId).digest("hex");
}

/** Resolves the Convex site URL used for HTTP actions, falling back from cloud URL. */
function resolveConvexSiteUrl(convexCloudUrl: string): string {
  const configured = process.env.CONVEX_SITE_URL;
  if (configured) return configured;
  return convexCloudUrl.replace(".convex.cloud", ".convex.site");
}

/** Installs the Claude CLI globally if not already available on the sandbox. */
async function ensureClaudeCliAvailable(sandbox: SandboxHandle): Promise<void> {
  await execHandle(
    sandbox,
    `if ! command -v claude >/dev/null 2>&1 && [ ! -x ${quote([CLAUDE_FALLBACK_BIN_PATH])} ]; then npm install -g --prefix ${quote([CLAUDE_FALLBACK_INSTALL_DIR])} @anthropic-ai/claude-code; fi`,
    CLAUDE_INSTALL_TIMEOUT_SECONDS,
  );
}

/** Installs the Codex runtime used by App Server and the SDK when absent. */
async function ensureCodexRuntimeAvailable(
  sandbox: SandboxHandle,
): Promise<void> {
  await execHandle(
    sandbox,
    `if ! command -v codex >/dev/null 2>&1 && [ ! -x ${quote([CODEX_FALLBACK_BIN_PATH])} ]; then npm install -g --prefix ${quote([CODEX_FALLBACK_INSTALL_DIR])} @openai/codex; fi`,
    CODEX_INSTALL_TIMEOUT_SECONDS,
  );
}

/** Installs the opencode CLI globally if not already available on the sandbox. */
async function ensureOpencodeCliAvailable(
  sandbox: SandboxHandle,
): Promise<void> {
  await execHandle(
    sandbox,
    `if ! command -v opencode >/dev/null 2>&1 && [ ! -x ${quote([OPENCODE_FALLBACK_BIN_PATH])} ]; then npm install -g --prefix ${quote([OPENCODE_FALLBACK_INSTALL_DIR])} opencode-ai; fi`,
    OPENCODE_INSTALL_TIMEOUT_SECONDS,
  );
}

/** Installs the CLI for the selected provider, if any, before launch. */
function ensureProviderCliAvailable(
  sandbox: SandboxHandle,
  provider: AIProvider,
): Promise<void> {
  switch (provider) {
    case "claude":
      return ensureClaudeCliAvailable(sandbox);
    case "codex":
      return ensureCodexRuntimeAvailable(sandbox);
    case "opencode":
      return ensureOpencodeCliAvailable(sandbox);
    // "cursor" needs no provisioning: @cursor/sdk is installed globally in the
    // seed snapshot, and the callback script self-installs it as a fallback on
    // old snapshots.
    default:
      return Promise.resolve();
  }
}

/**
 * Points pnpm at the sandbox user's store for shells whose HOME is an agent
 * runtime dir. Cursor's agent runs its shell with HOME=/tmp/cursor-home, so a
 * pnpm install there silently builds a second multi-GB store; the per-home
 * .npmrc makes every home resolve the same store. Existing duplicate stores
 * are deleted — installed node_modules keep their content via hard links.
 */
function ensureSharedPnpmStore(sandbox: SandboxHandle): Promise<void> {
  const storeDir = "/home/vercel-sandbox/.local/share/pnpm";
  const homes = [
    CODEX_RUNTIME_HOME_DIR,
    OPENCODE_RUNTIME_HOME_DIR,
    CURSOR_RUNTIME_HOME_DIR,
  ];
  const perHome = homes.map(
    (home) =>
      `mkdir -p ${home} && { grep -qs '^store-dir=' ${home}/.npmrc || echo 'store-dir=${storeDir}' >> ${home}/.npmrc; } && rm -rf ${home}/.local/share/pnpm`,
  );
  return execHandle(sandbox, `${perHome.join("; ")}; true`, 30).then(() => {});
}

/** Per-entity spawn lock the runner holds for its lifetime (see launchScript). */
function runnerFlockPath(entityIdField: string, entityId: string): string {
  return `/tmp/eva-runner.${entityIdField}-${entityId}.lock`;
}

/** Uploads the bundled callback runner + fingerprint without starting a process. */
export async function uploadCallbackScriptBundle(
  sandbox: SandboxHandle,
): Promise<void> {
  await Promise.all([
    sandbox.writeFile("/tmp/run-design.mjs", CALLBACK_SCRIPT),
    sandbox.writeFile("/tmp/eva-callback-fp", CALLBACK_SCRIPT_FINGERPRINT),
  ]);
}

/** Uploads prompt and callback script to the sandbox, then launches the AI runner process. */
export async function launchScript(
  sandbox: SandboxHandle,
  prompt: string,
  completionMutation: string,
  entityIdField: string,
  convexToken: string,
  entityId: string,
  opts: {
    model?: string;
    allowedTools?: string;
    systemPrompt?: string;
    extraEnvVars?: Record<string, string>;
    claudeSessionId?: string;
    mcpToken?: string;
    mcpBaseUrl?: string;
    /** Serialized installed system-skill stubs; see `systemSkills.ts` in the callback. */
    systemSkillsJson?: string;
    claimMutation?: string;
    openSyntheticTurnMutation?: string;
    completeSyntheticTurnMutation?: string;
    updateBackgroundAgentsMutation?: string;
  } = {},
): Promise<void> {
  const launchStartedAt = Date.now();
  console.log(
    `[sandbox][launchScript] started entityId=${entityId} sandboxId=${sandbox.id}`,
  );
  const normalizedModel = normalizeAIModel(opts.model);
  const provider = getAIModelProvider(normalizedModel);
  const providerPrep = Promise.all([
    ensureProviderCliAvailable(sandbox, provider),
    ensureSharedPnpmStore(sandbox),
  ]);
  function uploadWithTiming(
    path: string,
    content: string,
    label: string,
  ): Promise<void> {
    return sandbox.writeFile(path, content).then(() => {
      console.log(
        `[sandbox][launchScript] ${label} uploaded in ${Date.now() - launchStartedAt}ms entityId=${entityId}`,
      );
    });
  }
  const uploadTasks: Array<Promise<void>> = [
    uploadWithTiming("/tmp/design-prompt.txt", prompt, "prompt"),
    uploadWithTiming("/tmp/run-design.mjs", CALLBACK_SCRIPT, "callback script"),
    uploadWithTiming(
      "/tmp/eva-callback-fp",
      CALLBACK_SCRIPT_FINGERPRINT,
      "callback fingerprint",
    ),
  ];

  // Written on every launch, empty list included: the file persists on a reused
  // sandbox, so an unconditional write is what lets the callback prune stubs
  // for skills that have since been uninstalled.
  if (opts.systemSkillsJson !== undefined) {
    uploadTasks.push(
      uploadWithTiming(
        "/tmp/eva-system-skills.json",
        opts.systemSkillsJson,
        "system skills",
      ),
    );
  }

  await Promise.all([providerPrep, ...uploadTasks]);

  const convexUrl = requireEnv("CONVEX_CLOUD_URL");
  const streamingEntityId = opts.extraEnvVars?.STREAMING_ENTITY_ID ?? entityId;
  const streamingHmac = computeStreamingHmac(streamingEntityId);
  const envParts = [
    `CONVEX_URL=${quote([convexUrl])}`,
    `CONVEX_TOKEN=${quote([convexToken])}`,
    `ENTITY_ID=${quote([entityId])}`,
    `COMPLETION_MUTATION=${quote([completionMutation])}`,
    `ENTITY_ID_FIELD=${quote([entityIdField])}`,
    `AI_PROVIDER=${quote([provider])}`,
    `AI_MODEL=${quote([normalizedModel])}`,
    `CLAUDE_MODEL=${quote([normalizedModel])}`,
    `ALLOWED_TOOLS=${quote([opts.allowedTools ?? "Read,Glob,Grep,Skill"])}`,
    `SYSTEM_PROMPT=${quote([opts.systemPrompt ?? ""])}`,
    // Claude Code backgrounds Agent/Bash by default; Eva's turn ends on the
    // SDK `result` event, so a backgrounded sub-agent can never report back.
    // Force synchronous tools so sub-agent work stays inside the same turn.
    `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`,
    `CODEX_RUNTIME_HOME_DIR=${quote([CODEX_RUNTIME_HOME_DIR])}`,
    `CODEX_PERSIST_DIR=${quote([CODEX_PERSIST_VOLUME_MOUNT_PATH])}`,
    `CODEX_BIN_PATH=${quote([CODEX_FALLBACK_BIN_PATH])}`,
    `CLAUDE_BIN_PATH=${quote([CLAUDE_FALLBACK_BIN_PATH])}`,
    `OPENCODE_RUNTIME_HOME_DIR=${quote([OPENCODE_RUNTIME_HOME_DIR])}`,
    `OPENCODE_PERSIST_DIR=${quote([OPENCODE_PERSIST_VOLUME_MOUNT_PATH])}`,
    `EVA_OPENCODE_BIN_PATH=${quote([OPENCODE_FALLBACK_BIN_PATH])}`,
    `CURSOR_RUNTIME_HOME_DIR=${quote([CURSOR_RUNTIME_HOME_DIR])}`,
    `CURSOR_PERSIST_DIR=${quote([CURSOR_PERSIST_VOLUME_MOUNT_PATH])}`,
  ];
  if (streamingHmac) {
    envParts.push(
      `CONVEX_SITE_URL=${quote([resolveConvexSiteUrl(convexUrl)])}`,
    );
    envParts.push(`STREAMING_HMAC=${quote([streamingHmac])}`);
  }
  if (opts.claudeSessionId) {
    envParts.push(`CLAUDE_SESSION_ID=${quote([opts.claudeSessionId])}`);
    envParts.push(`CLAUDE_BASE_CONFIG_DIR=${quote([CLAUDE_BASE_CONFIG_DIR])}`);
    envParts.push(
      `CLAUDE_RUNTIME_CONFIG_DIR=${quote([CLAUDE_RUNTIME_CONFIG_DIR])}`,
    );
    envParts.push(
      `CLAUDE_PERSIST_DIR=${quote([CLAUDE_PERSIST_VOLUME_MOUNT_PATH])}`,
    );
  }
  if (opts.claimMutation) {
    envParts.push(`CLAIM_MUTATION=${quote([opts.claimMutation])}`);
  }
  if (opts.openSyntheticTurnMutation) {
    envParts.push(
      `OPEN_SYNTHETIC_TURN_MUTATION=${quote([opts.openSyntheticTurnMutation])}`,
    );
  }
  if (opts.completeSyntheticTurnMutation) {
    envParts.push(
      `COMPLETE_SYNTHETIC_TURN_MUTATION=${quote([opts.completeSyntheticTurnMutation])}`,
    );
  }
  if (opts.updateBackgroundAgentsMutation) {
    envParts.push(
      `UPDATE_BACKGROUND_AGENTS_MUTATION=${quote([opts.updateBackgroundAgentsMutation])}`,
    );
  }
  if (opts.extraEnvVars) {
    for (const [key, val] of Object.entries(opts.extraEnvVars)) {
      envParts.push(`${key}=${quote([val])}`);
    }
  }
  // Reserved Eva values are appended after repo/user env so they cannot be
  // shadowed. The callback consumes and removes them before agent tools spawn.
  if (opts.mcpBaseUrl && opts.mcpToken) {
    envParts.push(`EVA_MCP_AUTH=${quote([opts.mcpToken])}`);
    envParts.push(`EVA_MCP_BASE_URL=${quote([opts.mcpBaseUrl])}`);
  }
  envParts.push(`CALLBACK_SCRIPT_FP=${quote([CALLBACK_SCRIPT_FINGERPRINT])}`);
  const exportLines = envParts.map((part) => `export ${part}`);
  // Kernel-enforced single-runner-per-entity: spawn under an exclusive flock
  // held for the runner's lifetime (flock(1) execs node, so the lock fd rides
  // the runner process itself and the kernel releases it on death — no stale
  // pid or pid-reuse races). Concurrent launches for the same entity lose the
  // lock instantly (exit 217) instead of booting a duplicate daemon, and
  // waitForRunnerReady decides whether the lock holder is the runner this
  // launch wanted; the daemon's own pidfile fence remains as fallback for
  // images without flock(1), where this fails open.
  const runnerLockPath = runnerFlockPath(entityIdField, entityId);
  const runnerLaunchScript = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `[ -f ${EVA_ENV_FILE} ] && . ${EVA_ENV_FILE}`,
    "rm -f /tmp/run-design.pid /tmp/run-design.ready /tmp/eva-mcp.json",
    ...exportLines,
    // The script carries per-launch credentials, so unlink it once this shell
    // has loaded the exports and before the long-lived callback is spawned.
    'rm -f "$0"',
    "if command -v flock >/dev/null 2>&1; then",
    `  nohup flock -n -E 217 ${runnerLockPath} node /tmp/run-design.mjs >> /tmp/design.log 2>&1 &`,
    "else",
    "  nohup node /tmp/run-design.mjs >> /tmp/design.log 2>&1 &",
    "fi",
    "echo $! > /tmp/run-design.pid",
    // Privileged half of the OOM bias: the callback lowers its own
    // oom_score_adj to -600 (callback-src/index.ts) but lowering needs root,
    // so that write no-ops unprivileged — observed in prod as the callback
    // dying silently under memory pressure while dev servers survived. Lower
    // it here via sudo instead. CLI subtrees are re-raised to 300 at spawn
    // (callback-src/runtime/cliAttempt.ts), so the kernel kill order becomes:
    // dev servers and agent work first (both recover — preview self-heal and
    // turn error reporting), the heartbeat/reporting callback last. Fail open
    // on images without passwordless sudo.
    'echo -600 | sudo -n tee "/proc/$(cat /tmp/run-design.pid)/oom_score_adj" >/dev/null 2>&1 || true',
  ].join("\n");
  await sandbox.writeFile("/tmp/eva-launch-runner.sh", runnerLaunchScript);
  // Use the provider-native detached path; waitForRunnerReady confirms the
  // backgrounded runner actually started.
  // Use handle.exec (not execHandle) so cwd stays at the Vercel default — the script
  await sandbox.execDetached(
    "chmod +x /tmp/eva-launch-runner.sh && /tmp/eva-launch-runner.sh",
    { timeoutSeconds: 15 },
  );
  await waitForRunnerReady(sandbox, entityId, {
    runnerLockPath,
    daemonPaths: entityDaemonPaths(entityIdField, entityId),
    // Only a daemon launch can be satisfied by an incumbent runner, and only
    // one whose opts signature matches (see waitForRunnerReady).
    expectedDaemonOptsSig: opts.extraEnvVars?.EVA_DAEMON_OPTS,
  });
  console.log(
    `[sandbox][launchScript] runner ready in ${Date.now() - launchStartedAt}ms entityId=${entityId}`,
  );
}

/** Polls for /tmp/run-design.ready after a detached runner launch. */
async function waitForRunnerReady(
  sandbox: SandboxHandle,
  entityId: string,
  fence: {
    runnerLockPath: string;
    daemonPaths: { pid: string; opts: string };
    expectedDaemonOptsSig: string | undefined;
  },
): Promise<void> {
  for (let attempt = 0; attempt < CALLBACK_READY_POLL_ATTEMPTS; attempt++) {
    const ready = (
      await execHandle(
        sandbox,
        `test -f /tmp/run-design.ready && echo yes || echo no`,
        5,
      )
    ).trim();
    if (ready === "yes") {
      return;
    }

    const alive = (
      await execHandle(
        sandbox,
        `pid=$(cat /tmp/run-design.pid 2>/dev/null || true); if [ -z "$pid" ]; then echo pending; elif kill -0 "$pid" 2>/dev/null; then echo alive; else echo dead; fi`,
        5,
      )
    ).trim();
    if (alive === "dead") {
      // A loser of the spawn flock exits immediately, before writing the ready
      // file. A held lock alone is NOT success: the holder can be a stale
      // subtree fd (children inherit the lock fd), a daemon with different
      // model/tools than this launch asked for, or — for a one-shot turn — a
      // warm daemon that will never run this launch's prompt. Only accept it
      // when a live daemon owns the entity pidfile with our exact opts sig.
      const lock = (
        await execHandle(
          sandbox,
          `if ! command -v flock >/dev/null 2>&1; then echo nolock; elif flock -n ${quote([fence.runnerLockPath])} true 2>/dev/null; then echo free; else echo held; fi`,
          5,
        )
      ).trim();
      if (lock === "held" && fence.expectedDaemonOptsSig !== undefined) {
        const incumbent = (
          await execHandle(
            sandbox,
            `pid=$(cat ${quote([fence.daemonPaths.pid])} 2>/dev/null || true); ` +
              `if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then echo norunner; ` +
              `elif [ "$(cat ${quote([fence.daemonPaths.opts])} 2>/dev/null)" = ${quote([fence.expectedDaemonOptsSig])} ]; then echo match; ` +
              `else echo optsmismatch; fi`,
            5,
          )
        ).trim();
        if (incumbent === "match") {
          console.log(
            `[sandbox][launchScript] spawn lock held by a live daemon with matching opts — reusing it entityId=${entityId}`,
          );
          return;
        }
        console.log(
          `[sandbox][launchScript] spawn lock held but incumbent unusable (${incumbent}) entityId=${entityId}`,
        );
      }
      const log = await execHandle(
        sandbox,
        `tail -n 120 /tmp/design.log 2>/dev/null || true`,
        10,
      );
      throw new Error(
        `[sandbox][launchScript] runner died entityId=${entityId} spawnLock=${lock}: ${log}`,
      );
    }

    await new Promise((resolve) => {
      setTimeout(resolve, CALLBACK_READY_POLL_INTERVAL_MS);
    });
  }

  const log = await execHandle(
    sandbox,
    `tail -n 120 /tmp/design.log 2>/dev/null || true`,
    10,
  );
  await execHandle(
    sandbox,
    `pid=$(cat /tmp/run-design.pid 2>/dev/null || true); if [ -n "$pid" ]; then kill "$pid" 2>/dev/null || true; fi`,
    5,
  );
  throw new Error(
    `[sandbox][launchScript] runner ready timeout entityId=${entityId}: ${log}`,
  );
}
