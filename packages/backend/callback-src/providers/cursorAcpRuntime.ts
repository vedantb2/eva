import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
import type {
  AgentCapabilities,
  ClientContext,
  McpServer,
  SessionConfigOption,
  SessionModeState,
} from "@agentclientprotocol/sdk";
import {
  CURSOR_BIN_PATH,
  CURSOR_RUNTIME_HOME_DIR,
  MODEL,
  SYSTEM_PROMPT,
  WORK_DIR,
  normalizedCursorModel,
} from "../config.js";
import { applyCanonicalEvents } from "../parse/canonical.js";
import { writeCursorAcpSessionState } from "../session/cursorSession.js";
import type {
  CanonicalEvent,
  CursorAcpAttemptResult,
  SessionMode,
} from "../types.js";
import { log, tryParseJson } from "../utils.js";
import { CursorAcpEventAdapter } from "./cursorAcpEvents.js";
import {
  acceptCursorPlan,
  answerCursorQuestion,
  autoApproveCursorPermission,
  cursorAskQuestionRequestSchema,
  cursorCreatePlanRequestSchema,
  cursorGenerateImageRequestSchema,
  cursorGeneratedImageToCanonical,
  cursorTaskRequestSchema,
  cursorTaskToCanonical,
  cursorTodosToCanonical,
  cursorUpdateTodosRequestSchema,
} from "./cursorAcpInteractions.js";

const STDERR_TAIL_LIMIT = 32_000;

export type CursorAcpSessionOptions = {
  sessionMode: SessionMode;
  mcpServers?: McpServer[];
  onEvents?: (events: CanonicalEvent[]) => void | Promise<void>;
};

export type CursorAcpRunOptions = CursorAcpSessionOptions & {
  prompt: string;
  signal?: AbortSignal;
};

export type CursorAcpSession = {
  sessionId: string;
  prompt: (
    prompt: string,
    signal?: AbortSignal,
  ) => Promise<CursorAcpAttemptResult>;
  cancel: () => Promise<void>;
};

/** Reads Eva's generated HTTP MCP descriptors without exposing header values. */
export function readCursorAcpMcpServers(): McpServer[] {
  if (!existsSync("/tmp/eva-mcp.json")) return [];
  const parsed = tryParseJson(readFileSync("/tmp/eva-mcp.json", "utf8"));
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    !parsed.mcpServers ||
    typeof parsed.mcpServers !== "object" ||
    Array.isArray(parsed.mcpServers)
  ) {
    return [];
  }

  const servers: McpServer[] = [];
  for (const [name, value] of Object.entries(parsed.mcpServers)) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      typeof value.url !== "string"
    ) {
      continue;
    }
    const headers: { name: string; value: string }[] = [];
    if (
      value.headers &&
      typeof value.headers === "object" &&
      !Array.isArray(value.headers)
    ) {
      for (const [headerName, headerValue] of Object.entries(value.headers)) {
        if (typeof headerValue === "string") {
          headers.push({ name: headerName, value: headerValue });
        }
      }
    }
    servers.push({ type: "http", name, url: value.url, headers });
  }
  return servers;
}

type CursorAcpSessionSetup = {
  sessionId: string;
  modes: SessionModeState | null | undefined;
  configOptions: SessionConfigOption[] | null | undefined;
};

function appendBoundedTail(current: string, chunk: string): string {
  const combined = current + chunk;
  return combined.length <= STDERR_TAIL_LIMIT
    ? combined
    : combined.slice(combined.length - STDERR_TAIL_LIMIT);
}

function cursorCommand(): string {
  return existsSync(CURSOR_BIN_PATH) ? CURSOR_BIN_PATH : "cursor-agent";
}

function combinedPrompt(prompt: string): string {
  return SYSTEM_PROMPT ? `${SYSTEM_PROMPT}\n\n${prompt}` : prompt;
}

function selectValues(option: SessionConfigOption): string[] {
  if (option.type !== "select") return [];
  const values: string[] = [];
  for (const item of option.options) {
    if ("value" in item) {
      values.push(item.value);
      continue;
    }
    for (const nested of item.options) values.push(nested.value);
  }
  return values;
}

async function configureModel(
  context: ClientContext,
  setup: CursorAcpSessionSetup,
): Promise<void> {
  const options = setup.configOptions ?? [];
  const modelOption = options.find(
    (option) =>
      option.type === "select" &&
      (option.category === "model" ||
        option.id.toLowerCase().includes("model")),
  );
  if (!modelOption || modelOption.type !== "select") {
    throw new Error(
      `Cursor ACP did not advertise a model configuration option for ${MODEL}`,
    );
  }
  const available = selectValues(modelOption);
  if (!available.includes(normalizedCursorModel)) {
    throw new Error(
      `Cursor ACP model ${normalizedCursorModel} is unavailable; advertised values: ${available.join(", ")}`,
    );
  }
  if (modelOption.currentValue === normalizedCursorModel) return;
  await context.request(acp.methods.agent.session.setConfigOption, {
    sessionId: setup.sessionId,
    configId: modelOption.id,
    value: normalizedCursorModel,
  });
}

async function startOrRestoreSession(
  context: ClientContext,
  capabilities: AgentCapabilities | undefined,
  sessionMode: SessionMode,
  mcpServers: McpServer[],
  adapter: CursorAcpEventAdapter,
): Promise<CursorAcpSessionSetup> {
  const savedSessionId = sessionMode.sessionId?.trim() || "";
  if (sessionMode.mode === "resume" && savedSessionId) {
    adapter.setSession(savedSessionId);
    const canResume =
      capabilities?.sessionCapabilities?.resume !== undefined &&
      capabilities.sessionCapabilities.resume !== null;
    if (canResume) {
      const resumed = await context.request(acp.methods.agent.session.resume, {
        sessionId: savedSessionId,
        cwd: WORK_DIR,
        mcpServers,
      });
      log("cursor_acp session=resume");
      return {
        sessionId: savedSessionId,
        modes: resumed.modes,
        configOptions: resumed.configOptions,
      };
    }
    if (capabilities?.loadSession !== true) {
      throw new Error(
        "Cursor ACP cannot restore the saved session: neither resume nor load is advertised",
      );
    }
    adapter.beginReplay();
    try {
      const loaded = await context.request(acp.methods.agent.session.load, {
        sessionId: savedSessionId,
        cwd: WORK_DIR,
        mcpServers,
      });
      log(
        `cursor_acp session=load replay_updates=${adapter.getReplayNotificationCount()}`,
      );
      return {
        sessionId: savedSessionId,
        modes: loaded?.modes,
        configOptions: loaded?.configOptions,
      };
    } finally {
      adapter.endReplay();
    }
  }

  const created = await context.request(acp.methods.agent.session.new, {
    cwd: WORK_DIR,
    mcpServers,
  });
  adapter.setSession(created.sessionId);
  writeCursorAcpSessionState(created.sessionId);
  log("cursor_acp session=new");
  return {
    sessionId: created.sessionId,
    modes: created.modes,
    configOptions: created.configOptions,
  };
}

function registerClientHandlers(
  adapter: CursorAcpEventAdapter,
  emit: (events: CanonicalEvent[]) => Promise<void>,
) {
  return acp
    .client({ name: "eva-cursor-acp" })
    .onNotification(acp.methods.client.session.update, async ({ params }) => {
      await emit(adapter.handle(params));
    })
    .onRequest(acp.methods.client.session.requestPermission, ({ params }) =>
      autoApproveCursorPermission(params),
    )
    .onRequest(
      "cursor/ask_question",
      cursorAskQuestionRequestSchema,
      async ({ params, signal }) => await answerCursorQuestion(params, signal),
    )
    .onRequest(
      "cursor/create_plan",
      cursorCreatePlanRequestSchema,
      async ({ params }) => {
        const accepted = acceptCursorPlan(params);
        await emit(adapter.record(accepted.events));
        return accepted.response;
      },
    )
    .onNotification(
      "cursor/update_todos",
      cursorUpdateTodosRequestSchema,
      async ({ params }) => {
        const events = cursorTodosToCanonical(params.todos);
        await emit(adapter.record(events));
      },
    )
    .onNotification(
      "cursor/task",
      cursorTaskRequestSchema,
      async ({ params }) => {
        const events = cursorTaskToCanonical(params);
        await emit(adapter.recordToolCompletion(events, params.toolCallId));
      },
    )
    .onNotification(
      "cursor/generate_image",
      cursorGenerateImageRequestSchema,
      async ({ params }) => {
        const events = cursorGeneratedImageToCanonical(params);
        await emit(adapter.recordToolCompletion(events, params.toolCallId));
      },
    );
}

/** Opens one reusable Cursor ACP child/session for a scoped operation. */
export async function withCursorAcpSession<T>(
  options: CursorAcpSessionOptions,
  operation: (session: CursorAcpSession) => Promise<T>,
): Promise<T> {
  if (!process.env.CURSOR_API_KEY?.trim()) {
    throw new Error(
      "CURSOR_API_KEY is missing in the sandbox environment â€” Cursor ACP cannot authenticate",
    );
  }

  const child = spawn(cursorCommand(), ["acp"], {
    cwd: WORK_DIR,
    env: { ...process.env, HOME: CURSOR_RUNTIME_HOME_DIR },
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (!child.stdin || !child.stdout || !child.stderr) {
    child.kill();
    throw new Error("Cursor ACP child did not expose the required stdio pipes");
  }

  let stderrTail = "";
  let childExitCode: number | null = null;
  let childSignal: NodeJS.Signals | null = null;
  child.stderr.on("data", (chunk) => {
    stderrTail = appendBoundedTail(stderrTail, String(chunk));
  });
  child.once("exit", (code, signal) => {
    childExitCode = code;
    childSignal = signal;
  });

  const adapter = new CursorAcpEventAdapter();
  let eventChain = Promise.resolve();
  const emit = (events: CanonicalEvent[]): Promise<void> => {
    if (events.length === 0) return eventChain;
    eventChain = eventChain.then(async () => {
      applyCanonicalEvents(events);
      await options.onEvents?.(events);
    });
    return eventChain;
  };
  const client = registerClientHandlers(adapter, emit);
  const stream = acp.ndJsonStream(
    Writable.toWeb(child.stdin),
    Readable.toWeb(child.stdout),
  );

  try {
    return await client.connectWith(stream, async (context) => {
      const initialized = await context.request(acp.methods.agent.initialize, {
        protocolVersion: acp.PROTOCOL_VERSION,
        clientCapabilities: {
          fs: { readTextFile: false, writeTextFile: false },
          terminal: false,
          plan: {},
        },
        clientInfo: { name: "eva", version: "1.0.0" },
      });
      if (initialized.protocolVersion !== acp.PROTOCOL_VERSION) {
        throw new Error(
          `Cursor negotiated unsupported ACP version ${initialized.protocolVersion}`,
        );
      }
      await context.request(acp.methods.agent.authenticate, {
        methodId: "cursor_login",
      });

      const setup = await startOrRestoreSession(
        context,
        initialized.agentCapabilities,
        options.sessionMode,
        options.mcpServers ?? [],
        adapter,
      );
      const sessionId = setup.sessionId;
      await configureModel(context, setup);
      writeCursorAcpSessionState(sessionId);
      let promptInFlight = false;
      const cancel = async (): Promise<void> => {
        if (!promptInFlight) return;
        await context.notify(acp.methods.agent.session.cancel, { sessionId });
      };
      return await operation({
        sessionId,
        cancel,
        async prompt(prompt, signal) {
          if (promptInFlight) {
            throw new Error(
              "Cursor ACP received an overlapping prompt for one session",
            );
          }
          promptInFlight = true;
          const promptStartedAt = Date.now();
          const generation = adapter.beginTurn();
          const cancelFromCaller = (): void => {
            void cancel();
          };
          signal?.addEventListener("abort", cancelFromCaller, { once: true });
          let stopReason: CursorAcpAttemptResult["stopReason"] = "cancelled";
          try {
            const response = await context.request(
              acp.methods.agent.session.prompt,
              {
                sessionId,
                prompt: [{ type: "text", text: combinedPrompt(prompt) }],
              },
            );
            stopReason = response.stopReason;
            await eventChain;
            return {
              transport: "acp-v1",
              sessionId,
              stopReason,
              result: adapter.getFinalText(),
              events: adapter.getEvents(),
              durationMs: Date.now() - promptStartedAt,
              promptSubmitted: true,
              cancellationAcknowledged: stopReason === "cancelled",
              childExitCode,
              childSignal,
              stderrTail,
            };
          } finally {
            signal?.removeEventListener("abort", cancelFromCaller);
            adapter.endTurn(generation);
            promptInFlight = false;
          }
        },
      });
    });
  } finally {
    child.stdin.end();
    if (!child.killed) child.kill();
  }
}

/** Runs one prompt through the official ACP SDK and returns its exact stop. */
export async function runCursorAcpAttempt(
  options: CursorAcpRunOptions,
): Promise<CursorAcpAttemptResult> {
  return await withCursorAcpSession(options, async (session) => {
    return await session.prompt(options.prompt, options.signal);
  });
}

export function readCursorPromptFile(): string {
  return readFileSync("/tmp/design-prompt.txt", "utf8");
}
