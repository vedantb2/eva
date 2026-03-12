"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { quote } from "shell-quote";
import { exec, requireEnv } from "./helpers";
import { CALLBACK_SCRIPT } from "./callbackScript";

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
  await sandbox.fs.uploadFile(
    Buffer.from(prompt, "utf-8"),
    "/tmp/design-prompt.txt",
  );

  await sandbox.fs.uploadFile(
    Buffer.from(CALLBACK_SCRIPT, "utf-8"),
    "/tmp/run-design.mjs",
  );

  if (opts.mcpBaseUrl && opts.mcpToken) {
    const mcpConfig = JSON.stringify({
      mcpServers: {
        eva: {
          url: `${opts.mcpBaseUrl}/mcp`,
          headers: {
            Authorization: `Bearer ${opts.mcpToken}`,
          },
        },
      },
    });
    await sandbox.fs.uploadFile(
      Buffer.from(mcpConfig, "utf-8"),
      "/tmp/eva-mcp.json",
    );
  }

  const convexUrl = requireEnv("CONVEX_CLOUD_URL");
  const envParts = [
    `CONVEX_URL=${quote([convexUrl])}`,
    `CONVEX_TOKEN=${quote([convexToken])}`,
    `ENTITY_ID=${quote([entityId])}`,
    `COMPLETION_MUTATION=${quote([completionMutation])}`,
    `ENTITY_ID_FIELD=${quote([entityIdField])}`,
    `CLAUDE_MODEL=${opts.model ?? "opus"}`,
    `ALLOWED_TOOLS=${quote([opts.allowedTools ?? "Read,Glob,Grep,Skill"])}`,
    `SYSTEM_PROMPT=${quote([opts.systemPrompt ?? ""])}`,
  ];
  if (opts.claudeSessionId) {
    envParts.push(`CLAUDE_SESSION_ID=${quote([opts.claudeSessionId])}`);
  }
  if (opts.extraEnvVars) {
    for (const [key, val] of Object.entries(opts.extraEnvVars)) {
      envParts.push(`${key}=${quote([val])}`);
    }
  }
  const envVars = envParts.join(" ");
  await exec(
    sandbox,
    `rm -f /tmp/run-design.pid /tmp/run-design.ready; ${envVars} nohup node /tmp/run-design.mjs > /tmp/design.log 2>&1 & echo $! > /tmp/run-design.pid; pid=$(cat /tmp/run-design.pid); if ! kill -0 "$pid" 2>/dev/null; then tail -n 120 /tmp/design.log 2>/dev/null || true; exit 1; fi; i=0; while [ "$i" -lt 25 ]; do if [ -f /tmp/run-design.ready ]; then exit 0; fi; if ! kill -0 "$pid" 2>/dev/null; then tail -n 120 /tmp/design.log 2>/dev/null || true; exit 1; fi; i=$((i+1)); sleep 1; done; tail -n 120 /tmp/design.log 2>/dev/null || true; kill "$pid" 2>/dev/null || true; exit 1`,
    40,
  );
}
