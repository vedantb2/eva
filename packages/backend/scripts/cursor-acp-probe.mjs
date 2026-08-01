import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";

const startedAt = Date.now();
const commandPath =
  process.env.CURSOR_BIN_PATH || "/home/eva/.local/bin/cursor-agent";
const command = existsSync(commandPath) ? commandPath : "cursor-agent";
const cwd = process.env.CURSOR_ACP_PROBE_CWD || process.cwd();
const prompt =
  process.env.CURSOR_ACP_PROBE_PROMPT ||
  "Reply with exactly: Cursor ACP probe passed.";

if (!process.env.CURSOR_API_KEY?.trim()) {
  throw new Error("CURSOR_API_KEY is required for the Cursor ACP probe");
}

const observedUpdateTypes = [];
const observedPermissionKinds = [];
let textBytes = 0;
let stderrTail = "";

const child = spawn(command, ["acp"], {
  cwd,
  env: process.env,
  stdio: ["pipe", "pipe", "pipe"],
});
if (!child.stdin || !child.stdout || !child.stderr) {
  child.kill();
  throw new Error("Cursor ACP probe did not receive stdio pipes");
}
child.stderr.on("data", (chunk) => {
  stderrTail = (stderrTail + String(chunk)).slice(-4000);
});

const client = acp
  .client({ name: "eva-cursor-acp-probe" })
  .onNotification(acp.methods.client.session.update, ({ params }) => {
    observedUpdateTypes.push(params.update.sessionUpdate);
    if (
      params.update.sessionUpdate === "agent_message_chunk" &&
      params.update.content.type === "text"
    ) {
      textBytes += Buffer.byteLength(params.update.content.text);
    }
  })
  .onRequest(acp.methods.client.session.requestPermission, ({ params }) => {
    observedPermissionKinds.push(
      ...params.options.map((option) => option.kind),
    );
    const selected =
      params.options.find((option) => option.kind === "allow_always") ??
      params.options.find((option) => option.kind === "allow_once");
    if (!selected) {
      return { outcome: { outcome: "cancelled" } };
    }
    return {
      outcome: { outcome: "selected", optionId: selected.optionId },
    };
  });

try {
  const result = await client.connectWith(
    acp.ndJsonStream(Writable.toWeb(child.stdin), Readable.toWeb(child.stdout)),
    async (context) => {
      const initialized = await context.request(acp.methods.agent.initialize, {
        protocolVersion: acp.PROTOCOL_VERSION,
        clientCapabilities: {
          fs: { readTextFile: false, writeTextFile: false },
          terminal: false,
          plan: {},
        },
        clientInfo: { name: "eva-cursor-acp-probe", version: "1.0.0" },
      });
      const session = await context.request(acp.methods.agent.session.new, {
        cwd,
        mcpServers: [],
      });
      const promptResponse = await context.request(
        acp.methods.agent.session.prompt,
        {
          sessionId: session.sessionId,
          prompt: [{ type: "text", text: prompt }],
        },
      );
      return {
        protocolVersion: initialized.protocolVersion,
        agentCapabilities: Object.keys(
          initialized.agentCapabilities ?? {},
        ).sort(),
        authMethodIds: (initialized.authMethods ?? []).map(
          (method) => method.id,
        ),
        sessionIdPresent: session.sessionId.length > 0,
        modeIds: (session.modes?.availableModes ?? []).map((mode) => mode.id),
        configOptions: (session.configOptions ?? []).map((option) => ({
          id: option.id,
          category: option.category ?? null,
          type: option.type,
        })),
        stopReason: promptResponse.stopReason,
      };
    },
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: result.stopReason === "end_turn" && textBytes > 0,
        ...result,
        updateTypes: [...new Set(observedUpdateTypes)],
        permissionKinds: [...new Set(observedPermissionKinds)],
        textBytes,
        durationMs: Date.now() - startedAt,
        stderrBytes: Buffer.byteLength(stderrTail),
      },
      null,
      2,
    )}\n`,
  );
} finally {
  child.stdin.end();
  if (!child.killed) child.kill();
}
