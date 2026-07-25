"use node";

import { createHmac } from "crypto";
import { quote } from "shell-quote";
import { getAIModelProvider, normalizeAIModel } from "../validators";
import type { AIProvider } from "../validators";
import { execHandle, requireEnv } from "./helpers";
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
// Cursor CLI installs via curl to ~/.local/bin/cursor-agent (the `agent` binary
// alias). We keep a fallback path under /tmp so repeated sandbox reuse doesn't
// require re-downloading if the installer symlinks to /tmp.
const CURSOR_INSTALL_TIMEOUT_SECONDS = 300;
const CURSOR_FALLBACK_BIN_PATH = "/home/eva/.local/bin/cursor-agent";
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

/** Installs the Codex CLI globally if not already available on the sandbox. */
async function ensureCodexCliAvailable(sandbox: SandboxHandle): Promise<void> {
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

/** Installs the Cursor CLI if not already available on the sandbox. Cursor ships as a curl-bash installer (not npm) that drops the `cursor-agent` binary into ~/.local/bin. */
async function ensureCursorCliAvailable(sandbox: SandboxHandle): Promise<void> {
  await execHandle(
    sandbox,
    `if ! command -v cursor-agent >/dev/null 2>&1 && [ ! -x ${quote([CURSOR_FALLBACK_BIN_PATH])} ]; then curl -fsS https://cursor.com/install -o /tmp/cursor-install.sh && HOME=/home/eva bash /tmp/cursor-install.sh; fi; if [ ! -x ${quote([CURSOR_FALLBACK_BIN_PATH])} ] && [ -x /home/eva/.local/bin/agent ]; then ln -sf /home/eva/.local/bin/agent ${quote([CURSOR_FALLBACK_BIN_PATH])}; fi`,
    CURSOR_INSTALL_TIMEOUT_SECONDS,
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
      return ensureCodexCliAvailable(sandbox);
    case "opencode":
      return ensureOpencodeCliAvailable(sandbox);
    case "cursor":
      return ensureCursorCliAvailable(sandbox);
    default:
      return Promise.resolve();
  }
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
  const providerPrep = ensureProviderCliAvailable(sandbox, provider);
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

  if (opts.mcpBaseUrl && opts.mcpToken) {
    const mcpConfig = JSON.stringify({
      mcpServers: {
        eva: {
          type: "http",
          url: `${opts.mcpBaseUrl}/mcp`,
          headers: {
            Authorization: `Bearer ${opts.mcpToken}`,
          },
        },
      },
    });
    uploadTasks.push(
      uploadWithTiming("/tmp/eva-mcp.json", mcpConfig, "MCP config"),
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
    `CURSOR_BIN_PATH=${quote([CURSOR_FALLBACK_BIN_PATH])}`,
  ];
  // Deployment-level switch for Claude Agent SDK runtime shape: `sdk` (one-shot
  // query per turn) vs `sdk-daemon` (persistent warm session; callback default
  // when unset). Forward when set so a deployment can opt into one-shot SDK.
  if (process.env.CLAUDE_ATTEMPT_MODE) {
    envParts.push(
      `CLAUDE_ATTEMPT_MODE=${quote([process.env.CLAUDE_ATTEMPT_MODE])}`,
    );
  }
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
  envParts.push(`CALLBACK_SCRIPT_FP=${quote([CALLBACK_SCRIPT_FINGERPRINT])}`);
  const exportLines = envParts.map((part) => `export ${part}`);
  const runnerLaunchScript = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `[ -f ${EVA_ENV_FILE} ] && . ${EVA_ENV_FILE}`,
    "rm -f /tmp/run-design.pid /tmp/run-design.ready",
    ...exportLines,
    "nohup node /tmp/run-design.mjs >> /tmp/design.log 2>&1 &",
    "echo $! > /tmp/run-design.pid",
  ].join("\n");
  await sandbox.writeFile("/tmp/eva-launch-runner.sh", runnerLaunchScript);
  // Use the provider-native detached path; waitForRunnerReady confirms the
  // backgrounded runner actually started.
  // Use handle.exec (not execHandle) so cwd stays at the Vercel default — the script
  await sandbox.execDetached(
    "chmod +x /tmp/eva-launch-runner.sh && /tmp/eva-launch-runner.sh",
    { timeoutSeconds: 15 },
  );
  await waitForRunnerReady(sandbox, entityId);
  console.log(
    `[sandbox][launchScript] runner ready in ${Date.now() - launchStartedAt}ms entityId=${entityId}`,
  );
}

/** Polls for /tmp/run-design.ready after a detached runner launch. */
async function waitForRunnerReady(
  sandbox: SandboxHandle,
  entityId: string,
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
      const log = await execHandle(
        sandbox,
        `tail -n 120 /tmp/design.log 2>/dev/null || true`,
        10,
      );
      throw new Error(
        `[sandbox][launchScript] runner died entityId=${entityId}: ${log}`,
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
