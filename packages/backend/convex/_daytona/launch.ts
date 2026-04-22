"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { quote } from "shell-quote";
import { getAIModelProvider, normalizeAIModel } from "../validators";
import { exec, requireEnv } from "./helpers";
import { CALLBACK_SCRIPT } from "./callbackScript";
import {
  CLAUDE_BASE_CONFIG_DIR,
  CLAUDE_PERSIST_VOLUME_MOUNT_PATH,
  CLAUDE_RUNTIME_CONFIG_DIR,
  CODEX_PERSIST_VOLUME_MOUNT_PATH,
  CODEX_RUNTIME_HOME_DIR,
  CURSOR_PERSIST_VOLUME_MOUNT_PATH,
  CURSOR_RUNTIME_HOME_DIR,
  OPENCODE_PERSIST_VOLUME_MOUNT_PATH,
  OPENCODE_RUNTIME_HOME_DIR,
} from "./volumes";

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
const CALLBACK_READY_TIMEOUT_SECONDS = 75;
const CALLBACK_READY_POLL_ATTEMPTS = 60;

/** Installs the Codex CLI globally if not already available on the sandbox. */
async function ensureCodexCliAvailable(sandbox: Sandbox): Promise<void> {
  await exec(
    sandbox,
    `if ! command -v codex >/dev/null 2>&1 && [ ! -x ${quote([CODEX_FALLBACK_BIN_PATH])} ]; then npm install -g --prefix ${quote([CODEX_FALLBACK_INSTALL_DIR])} @openai/codex; fi`,
    CODEX_INSTALL_TIMEOUT_SECONDS,
  );
}

/** Installs the opencode CLI globally if not already available on the sandbox. */
async function ensureOpencodeCliAvailable(sandbox: Sandbox): Promise<void> {
  await exec(
    sandbox,
    `if ! command -v opencode >/dev/null 2>&1 && [ ! -x ${quote([OPENCODE_FALLBACK_BIN_PATH])} ]; then npm install -g --prefix ${quote([OPENCODE_FALLBACK_INSTALL_DIR])} opencode-ai; fi`,
    OPENCODE_INSTALL_TIMEOUT_SECONDS,
  );
}

/** Installs the Cursor CLI if not already available on the sandbox. Cursor ships as a curl-bash installer (not npm) that drops the `cursor-agent` binary into ~/.local/bin. */
async function ensureCursorCliAvailable(sandbox: Sandbox): Promise<void> {
  await exec(
    sandbox,
    `if ! command -v cursor-agent >/dev/null 2>&1 && [ ! -x ${quote([CURSOR_FALLBACK_BIN_PATH])} ]; then curl -fsS https://cursor.com/install | bash; fi`,
    CURSOR_INSTALL_TIMEOUT_SECONDS,
  );
}

/** Uploads prompt and callback script to the sandbox, then launches the AI runner process. */
export async function launchScript(
  sandbox: Sandbox,
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
  } = {},
): Promise<void> {
  const launchStartedAt = Date.now();
  console.log(
    `[daytona][launchScript] started entityId=${entityId} sandboxId=${sandbox.id}`,
  );
  const normalizedModel = normalizeAIModel(opts.model);
  const provider = getAIModelProvider(normalizedModel);
  if (provider === "codex") {
    await ensureCodexCliAvailable(sandbox);
  } else if (provider === "opencode") {
    await ensureOpencodeCliAvailable(sandbox);
  } else if (provider === "cursor") {
    await ensureCursorCliAvailable(sandbox);
  }
  const uploadTasks: Array<Promise<void>> = [
    sandbox.fs
      .uploadFile(Buffer.from(prompt, "utf-8"), "/tmp/design-prompt.txt")
      .then(() => {
        console.log(
          `[daytona][launchScript] prompt uploaded in ${Date.now() - launchStartedAt}ms entityId=${entityId}`,
        );
      }),
    sandbox.fs
      .uploadFile(Buffer.from(CALLBACK_SCRIPT, "utf-8"), "/tmp/run-design.mjs")
      .then(() => {
        console.log(
          `[daytona][launchScript] callback script uploaded in ${Date.now() - launchStartedAt}ms entityId=${entityId}`,
        );
      }),
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
      sandbox.fs
        .uploadFile(Buffer.from(mcpConfig, "utf-8"), "/tmp/eva-mcp.json")
        .then(() => {
          console.log(
            `[daytona][launchScript] MCP config uploaded in ${Date.now() - launchStartedAt}ms entityId=${entityId}`,
          );
        }),
    );
  }

  await Promise.all(uploadTasks);

  const convexUrl = requireEnv("CONVEX_CLOUD_URL");
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
    `CODEX_RUNTIME_HOME_DIR=${quote([CODEX_RUNTIME_HOME_DIR])}`,
    `CODEX_PERSIST_DIR=${quote([CODEX_PERSIST_VOLUME_MOUNT_PATH])}`,
    `CODEX_BIN_PATH=${quote([CODEX_FALLBACK_BIN_PATH])}`,
    `OPENCODE_RUNTIME_HOME_DIR=${quote([OPENCODE_RUNTIME_HOME_DIR])}`,
    `OPENCODE_PERSIST_DIR=${quote([OPENCODE_PERSIST_VOLUME_MOUNT_PATH])}`,
    `EVA_OPENCODE_BIN_PATH=${quote([OPENCODE_FALLBACK_BIN_PATH])}`,
    `CURSOR_RUNTIME_HOME_DIR=${quote([CURSOR_RUNTIME_HOME_DIR])}`,
    `CURSOR_PERSIST_DIR=${quote([CURSOR_PERSIST_VOLUME_MOUNT_PATH])}`,
    `CURSOR_BIN_PATH=${quote([CURSOR_FALLBACK_BIN_PATH])}`,
  ];
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
  if (opts.extraEnvVars) {
    for (const [key, val] of Object.entries(opts.extraEnvVars)) {
      envParts.push(`${key}=${quote([val])}`);
    }
  }
  const envVars = envParts.join(" ");
  await exec(
    sandbox,
    `rm -f /tmp/run-design.pid /tmp/run-design.ready; ${envVars} nohup node /tmp/run-design.mjs > /tmp/design.log 2>&1 & echo $! > /tmp/run-design.pid; pid=$(cat /tmp/run-design.pid); if ! kill -0 "$pid" 2>/dev/null; then tail -n 120 /tmp/design.log 2>/dev/null || true; exit 1; fi; i=0; while [ "$i" -lt ${CALLBACK_READY_POLL_ATTEMPTS} ]; do if [ -f /tmp/run-design.ready ]; then exit 0; fi; if ! kill -0 "$pid" 2>/dev/null; then tail -n 120 /tmp/design.log 2>/dev/null || true; exit 1; fi; i=$((i+1)); sleep 1; done; tail -n 120 /tmp/design.log 2>/dev/null || true; kill "$pid" 2>/dev/null || true; exit 1`,
    CALLBACK_READY_TIMEOUT_SECONDS,
  );
  console.log(
    `[daytona][launchScript] runner ready in ${Date.now() - launchStartedAt}ms entityId=${entityId}`,
  );
}
