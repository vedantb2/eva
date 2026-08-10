import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync } from "fs";
import {
  CURSOR_SDK_STORE_DIR,
  MAX_TOTAL_RUNTIME_MS,
  NO_OUTPUT_CHECK_INTERVAL_MS,
  NO_OUTPUT_TIMEOUT_MS,
  SYSTEM_PROMPT,
  WORK_DIR,
  cursorFastMode,
  cursorReasoningLevel,
  cursorUse1mContext,
  normalizedCursorModel,
} from "../config.js";
import { updateThinkingStep } from "../parse/canonical.js";
import { processRealtimeStdoutChunk } from "../parse/streamRouter.js";
import {
  appendToRawLogFile,
  appendToRawOutput,
  trimBufferHead,
} from "../runtime/buffers.js";
import { resetAttemptState } from "../runtime/cliAttempt.js";
import { callbackState as S } from "../runtime/state.js";
import {
  syncCursorStateToPersist,
  writeCursorSessionState,
} from "../session/cursorSession.js";
import type { CliAttemptResult, JsonValue, SessionMode } from "../types.js";
import { log, tryParseJson } from "../utils.js";
import { globalNpmRoot, type JsonLike } from "./claudeSdk.js";

const SDK_PACKAGE = "@cursor/sdk";
const SDK_VERSION = "1.0.26";
/** ESM entry inside the package (its exports map's `import` target). */
const SDK_ENTRY_RELPATH = "/dist/esm/index.js";
const MCP_CONFIG_PATH = "/tmp/eva-mcp.json";

/** User-writable fallback install location (persists in home across resumes). */
const SDK_LOCAL_PREFIX = "/home/eva/.eva-agent-sdk";

/**
 * Narrow structural types for the subset of the Cursor SDK this runner uses.
 * The SDK is dynamically imported from the sandbox's global npm root (installed
 * in the seed snapshot), so these stand in for the SDK's own types.
 */
export type SdkMcpServerConfig = {
  type: "http";
  url: string;
  headers?: Record<string, string>;
};

/** Opaque store handle — constructed, passed back to the SDK, never inspected. */
type SdkLocalAgentStore = {
  readonly agents?: object;
};

type SdkModelParameterValue = { id: string; value: string };

type SdkModelSelection = {
  id: string;
  params?: SdkModelParameterValue[];
};

export function cursorModeParams(
  model: string,
  fastMode: boolean,
  use1mContext: boolean,
): SdkModelParameterValue[] {
  const params: SdkModelParameterValue[] = [];
  if (model === "grok-4.5" || model === "composer-2.5") {
    params.push({ id: "fast", value: fastMode ? "true" : "false" });
  }
  if (use1mContext) {
    params.push({ id: "context", value: "1m" });
  }
  return params;
}

type SdkModelParameterDefinition = {
  id?: string;
  values?: Array<{ value?: string }>;
};

type SdkModelVariant = {
  params?: SdkModelParameterValue[];
  displayName?: string;
};

type SdkModel = {
  id?: string;
  parameters?: SdkModelParameterDefinition[];
  variants?: SdkModelVariant[];
};

/**
 * The `fast`/`context` parameter ids are not documented, so never trust them
 * blindly: with the model's Cursor.models.list() entry in hand, keep only the
 * params the model declares (matching id, and value when values are listed).
 * Without an entry (list failed, model absent) keep only the params the user
 * explicitly opted into — a wrong id then breaks the run the user asked for,
 * never the default runs of users who touched nothing.
 */
export function filterModeParamsByModel(
  candidates: SdkModelParameterValue[],
  model: SdkModel | undefined,
  opted: { fastMode: boolean; use1mContext: boolean },
): SdkModelParameterValue[] {
  if (!model) {
    return candidates.filter((param) =>
      param.id === "fast" ? opted.fastMode : opted.use1mContext,
    );
  }
  const definitions = Array.isArray(model.parameters) ? model.parameters : [];
  return candidates.filter((param) =>
    definitions.some((definition) => {
      if (!definition || definition.id !== param.id) return false;
      const values = Array.isArray(definition.values) ? definition.values : [];
      return (
        values.length === 0 ||
        values.some((entry) => entry && entry.value === param.value)
      );
    }),
  );
}

type SdkAgentOptions = {
  apiKey: string;
  model: SdkModelSelection;
  local: { cwd: string; store: SdkLocalAgentStore };
  mcpServers?: Record<string, SdkMcpServerConfig>;
};

type SdkTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
};

type SdkRunResult = {
  status?: string;
  result?: string;
  error?: { message?: string; code?: string };
  durationMs?: number;
  usage?: SdkTokenUsage;
};

type SdkRun = {
  stream: () => AsyncIterable<Record<string, JsonLike>>;
  wait: () => Promise<SdkRunResult>;
  cancel: () => Promise<void>;
};

type SdkSendOptions = { local?: { force?: boolean } };

type SdkAgent = {
  agentId: string;
  send: (message: string, options?: SdkSendOptions) => Promise<SdkRun>;
  close: () => void;
};

export type CursorSdkModule = {
  Agent: {
    create: (options: SdkAgentOptions) => Promise<SdkAgent>;
    resume: (agentId: string, options: SdkAgentOptions) => Promise<SdkAgent>;
  };
  JsonlLocalAgentStore: new (rootDir: string) => SdkLocalAgentStore;
  Cursor?: {
    models?: {
      list?: () => Promise<SdkModel[]>;
    };
  };
};

/**
 * Imports the Cursor SDK, preferring the base Image's global install (seeded in
 * snapshotActions). Older snapshots lack it, and the callback runs as the
 * unprivileged `eva` user, so the fallback is a one-time user-local prefix
 * install under the eva home — same pattern as the Claude Agent SDK loader.
 */
export async function loadCursorSdk(): Promise<CursorSdkModule> {
  const globalEntry = globalNpmRoot() + "/" + SDK_PACKAGE + SDK_ENTRY_RELPATH;
  const localEntry =
    SDK_LOCAL_PREFIX + "/node_modules/" + SDK_PACKAGE + SDK_ENTRY_RELPATH;
  if (existsSync(globalEntry)) {
    const mod: CursorSdkModule = await import(globalEntry);
    return mod;
  }
  if (!existsSync(localEntry)) {
    log(
      "cursor sdk not found in sandbox; installing " +
        SDK_PACKAGE +
        "@" +
        SDK_VERSION +
        " to " +
        SDK_LOCAL_PREFIX +
        " (one-time)",
    );
    execSync(
      "mkdir -p " +
        SDK_LOCAL_PREFIX +
        " && npm install --prefix " +
        SDK_LOCAL_PREFIX +
        " " +
        SDK_PACKAGE +
        "@" +
        SDK_VERSION,
      { encoding: "utf8", timeout: 180_000 },
    );
  }
  const mod: CursorSdkModule = await import(localEntry);
  return mod;
}

/**
 * Parses Eva's generated HTTP MCP descriptors into the SDK's inline mcpServers
 * shape (remote HTTP servers only, matching the old .cursor/mcp.json
 * translation). Header values are forwarded but never logged.
 */
export function parseCursorSdkMcpServers(
  raw: string,
): Record<string, SdkMcpServerConfig> {
  const servers: Record<string, SdkMcpServerConfig> = {};
  const parsed = tryParseJson(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    !parsed.mcpServers ||
    typeof parsed.mcpServers !== "object" ||
    Array.isArray(parsed.mcpServers)
  ) {
    return servers;
  }
  for (const [name, server] of Object.entries(parsed.mcpServers)) {
    if (
      !server ||
      typeof server !== "object" ||
      Array.isArray(server) ||
      typeof server.url !== "string" ||
      !server.url.trim()
    ) {
      continue;
    }
    const entry: SdkMcpServerConfig = { type: "http", url: server.url };
    if (
      server.headers &&
      typeof server.headers === "object" &&
      !Array.isArray(server.headers)
    ) {
      const headers: Record<string, string> = {};
      for (const [headerName, headerValue] of Object.entries(server.headers)) {
        if (typeof headerValue === "string") {
          headers[headerName] = headerValue;
        }
      }
      if (Object.keys(headers).length > 0) entry.headers = headers;
    }
    servers[name] = entry;
  }
  return servers;
}

function readCursorSdkMcpServers(): Record<string, SdkMcpServerConfig> {
  if (!existsSync(MCP_CONFIG_PATH)) return {};
  try {
    return parseCursorSdkMcpServers(readFileSync(MCP_CONFIG_PATH, "utf8"));
  } catch {
    return {};
  }
}

function readPromptText(): string {
  return readFileSync("/tmp/design-prompt.txt", "utf8");
}

/**
 * Builds the SDK ModelSelection for the configured eva model. Eva slugs bake a
 * reasoning level into the id (grok-4.5-low); the SDK's model list carries the
 * base id with reasoning exposed as a per-model parameter whose id is not
 * documented — so discover it from Cursor.models.list() at runtime: first a
 * parameter definition allowing the level value, then a variant carrying it.
 * A reasoning miss (no level, list unavailable, model/parameter absent) keeps
 * the base id and any explicitly selected Fast or context parameters.
 */
export async function resolveCursorModelSelection(
  sdk: CursorSdkModule,
): Promise<SdkModelSelection> {
  const base = normalizedCursorModel;
  const level = cursorReasoningLevel;
  // Cursor first-party models can default to their higher-priced Fast variant,
  // so send the explicit boolean — but only once the model's parameter list
  // confirms the undocumented id (filterModeParamsByModel). Context is opt-in.
  const candidates = cursorModeParams(base, cursorFastMode, cursorUse1mContext);
  const opted = { fastMode: cursorFastMode, use1mContext: cursorUse1mContext };
  if (candidates.length === 0 && !level) {
    return { id: base };
  }

  let model: SdkModel | undefined;
  let listUnavailable = false;
  try {
    const list = sdk.Cursor?.models?.list;
    if (list) {
      const models = await list();
      model = Array.isArray(models)
        ? models.find(
            (entry) => entry && typeof entry === "object" && entry.id === base,
          )
        : undefined;
      if (!model) {
        log(
          "resolveCursorModelSelection: model " +
            base +
            " not in Cursor.models.list — keeping opted-in params only",
        );
      }
    } else {
      listUnavailable = true;
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    listUnavailable = true;
    log(
      "resolveCursorModelSelection: model list failed — keeping opted-in params only (" +
        messageText +
        ")",
    );
  }

  const params = filterModeParamsByModel(candidates, model, opted);
  if (params.length < candidates.length && model) {
    log(
      "resolveCursorModelSelection: " +
        base +
        " does not declare " +
        candidates
          .filter((candidate) => !params.some((p) => p.id === candidate.id))
          .map((candidate) => candidate.id)
          .join(", ") +
        " — dropped",
    );
  }
  if (!level || listUnavailable || !model) {
    return params.length > 0 ? { id: base, params } : { id: base };
  }

  for (const definition of model.parameters ?? []) {
    if (!definition || typeof definition.id !== "string") continue;
    const values = Array.isArray(definition.values) ? definition.values : [];
    if (values.some((entry) => entry && entry.value === level)) {
      log(
        "resolveCursorModelSelection: " +
          base +
          " reasoning level " +
          level +
          " via parameter " +
          definition.id,
      );
      params.push({ id: definition.id, value: level });
      return { id: base, params };
    }
  }
  for (const variant of model.variants ?? []) {
    const variantParams = Array.isArray(variant?.params) ? variant.params : [];
    if (variantParams.some((param) => param && param.value === level)) {
      log(
        "resolveCursorModelSelection: " +
          base +
          " reasoning level " +
          level +
          " via variant params",
      );
      const remainingVariantParams = variantParams.filter(
        (variantParam) => !params.some((param) => param.id === variantParam.id),
      );
      return { id: base, params: [...params, ...remainingVariantParams] };
    }
  }
  log(
    "resolveCursorModelSelection: " +
      base +
      " exposes no parameter accepting '" +
      level +
      "' — sending base id",
  );
  return params.length > 0 ? { id: base, params } : { id: base };
}

/** Reads an SDK error's `code` field without assertions (Error → overlap via message). */
function errorCode(error: Error): string {
  const withCode: { message: string; code?: string } = error;
  return typeof withCode.code === "string" ? withCode.code : "";
}

function isAgentNotFound(error: Error): boolean {
  return (
    errorCode(error) === "agent_not_found" ||
    error.message.includes("agent_not_found")
  );
}

type UsageTokens = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

const ZERO_USAGE: UsageTokens = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

function readNum(value: JsonLike | number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Extracts camelCase TokenUsage fields from a stream `usage` event or RunResult. */
function readUsageTokens(
  value: JsonLike | SdkTokenUsage | undefined,
): UsageTokens | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const usage: SdkTokenUsage = value;
  return {
    inputTokens: readNum(usage.inputTokens),
    outputTokens: readNum(usage.outputTokens),
    cacheReadTokens: readNum(usage.cacheReadTokens),
    cacheWriteTokens: readNum(usage.cacheWriteTokens),
  };
}

/**
 * Runs one Cursor turn via the Cursor SDK (local agent in-process).
 *
 * Integration model mirrors runClaudeSdkAttempt: every SDK stream event is
 * serialized to a JSON line and pushed through the realtime pipeline
 * (processRealtimeStdoutChunk -> cursorParseLine -> canonical events ->
 * accumulated steps / session capture), so streaming, activity, session
 * persistence and completion share the same parser plumbing as other
 * providers. The turn result has no stream event in the SDK — it is
 * synthesized from run.wait() as a final `{type:"result"}` line, carrying the
 * SDK's real token usage (the CLI reported zeros).
 */
export async function runCursorSdkAttempt(
  sessionMode: SessionMode,
): Promise<CliAttemptResult> {
  resetAttemptState();
  S.activeAttemptStartedAt = Date.now();
  updateThinkingStep(
    "Starting Cursor agent...",
    sessionMode.mode === "resume"
      ? "Restoring saved context..."
      : "Creating Cursor agent...",
  );
  log(
    "runCursorSdkAttempt started (mode=" +
      sessionMode.mode +
      ", sessionId=" +
      (sessionMode.sessionId || "none") +
      ")",
  );

  let attemptOutput = "";
  let lastMessageAt = Date.now();
  let timedOutForNoOutput = false;
  let timedOutForMaxRuntime = false;
  let sawResult = false;
  let resultIsError = false;
  let attemptErrorMessage = "";
  let lastStreamUsage: UsageTokens | null = null;
  let activeRun: SdkRun | null = null;

  const sdk = await loadCursorSdk();
  mkdirSync(CURSOR_SDK_STORE_DIR, { recursive: true });
  const store = new sdk.JsonlLocalAgentStore(CURSOR_SDK_STORE_DIR);
  const mcpServers = readCursorSdkMcpServers();
  const options: SdkAgentOptions = {
    apiKey: (process.env.CURSOR_API_KEY || "").trim(),
    model: await resolveCursorModelSelection(sdk),
    local: { cwd: WORK_DIR, store },
    ...(Object.keys(mcpServers).length > 0 ? { mcpServers } : {}),
  };

  const persistAgentId = (agentId: string): void => {
    S.activeCursorSessionId = agentId;
    writeCursorSessionState();
    syncCursorStateToPersist();
  };

  const createFreshAgent = async (): Promise<SdkAgent> => {
    const created = await sdk.Agent.create(options);
    persistAgentId(created.agentId);
    return created;
  };

  // Resume with a catch-all self-heal: a persisted pre-migration CLI session
  // id (or a wiped/corrupt store) fails Agent.resume — degrade to a one-time
  // fresh agent instead of failing every future turn. Genuine environment
  // errors (bad key, bad model) re-throw identically from create and surface.
  let resumedExistingAgent = false;
  let agent: SdkAgent;
  if (sessionMode.mode === "resume" && sessionMode.sessionId) {
    try {
      agent = await sdk.Agent.resume(sessionMode.sessionId, options);
      resumedExistingAgent = true;
      persistAgentId(agent.agentId);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      log(
        "runCursorSdkAttempt: resume failed — starting a fresh agent (" +
          messageText +
          ")",
      );
      appendToRawLogFile("[sdk-retry] resume failed: " + messageText + "\n");
      agent = await createFreshAgent();
    }
  } else {
    agent = await createFreshAgent();
  }

  const promptText = readPromptText();
  const combinedPrompt = SYSTEM_PROMPT
    ? SYSTEM_PROMPT + "\n\n" + promptText
    : promptText;

  const cancelRun = (): void => {
    if (!activeRun) return;
    activeRun.cancel().catch(() => {
      /* already finished */
    });
  };
  const healthTimer = setInterval(() => {
    const now = Date.now();
    if (now - S.activeAttemptStartedAt > MAX_TOTAL_RUNTIME_MS) {
      timedOutForMaxRuntime = true;
      log("runCursorSdkAttempt: max runtime exceeded — cancelling run");
      cancelRun();
      return;
    }
    if (!sawResult && now - lastMessageAt > NO_OUTPUT_TIMEOUT_MS * 5) {
      timedOutForNoOutput = true;
      log("runCursorSdkAttempt: no SDK events — cancelling run");
      cancelRun();
    }
  }, NO_OUTPUT_CHECK_INTERVAL_MS);

  const pushLine = (line: string): void => {
    appendToRawLogFile(line);
    attemptOutput = trimBufferHead(attemptOutput + line);
    appendToRawOutput(line);
    processRealtimeStdoutChunk(line);
  };

  const runTurn = async (activeAgent: SdkAgent): Promise<void> => {
    // `force` expires a run left marked active by a killed prior callback
    // (user stop is a process-level kill); a no-op otherwise.
    const run = await activeAgent.send(combinedPrompt, {
      local: { force: true },
    });
    activeRun = run;
    for await (const message of run.stream()) {
      lastMessageAt = Date.now();
      pushLine(JSON.stringify(message) + "\n");
      if (message.type === "usage") {
        lastStreamUsage = readUsageTokens(message.usage) ?? lastStreamUsage;
      }
      if (timedOutForMaxRuntime || timedOutForNoOutput) break;
    }
    const result = await run.wait();
    const usage =
      readUsageTokens(result.usage) ?? lastStreamUsage ?? ZERO_USAGE;
    const isError = result.status !== "finished";
    const resultText =
      typeof result.result === "string" && result.result
        ? result.result
        : result.error && typeof result.error.message === "string"
          ? result.error.message
          : "";
    const syntheticResult: JsonValue = {
      type: "result",
      is_error: isError,
      result: resultText,
      duration_ms: readNum(result.durationMs),
      usage: {
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        cache_read_input_tokens: usage.cacheReadTokens,
        cache_creation_input_tokens: usage.cacheWriteTokens,
      },
    };
    pushLine(JSON.stringify(syntheticResult) + "\n");
    sawResult = true;
    resultIsError = isError;
  };

  try {
    try {
      await runTurn(agent);
    } catch (error) {
      // A resumed agent whose stored runs are unreadable can throw
      // agent_not_found past resume (at send/stream/wait). Retry once fresh so
      // a poisoned persisted id cannot fail every future turn.
      if (
        resumedExistingAgent &&
        error instanceof Error &&
        isAgentNotFound(error)
      ) {
        log(
          "runCursorSdkAttempt: resumed agent unusable — retrying as a fresh agent",
        );
        appendToRawLogFile("[sdk-retry] " + error.message + "\n");
        sawResult = false;
        resultIsError = false;
        try {
          agent.close();
        } catch {
          /* already closed */
        }
        agent = await createFreshAgent();
        await runTurn(agent);
      } else {
        throw error;
      }
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    attemptErrorMessage = messageText;
    log("runCursorSdkAttempt: run failed — " + messageText);
    appendToRawLogFile("[sdk-error] " + messageText + "\n");
    S.stderrOutput = trimBufferHead(S.stderrOutput + messageText + "\n");
  } finally {
    clearInterval(healthTimer);
    try {
      agent.close();
    } catch {
      /* already closed */
    }
  }

  const code =
    sawResult &&
    !resultIsError &&
    !timedOutForMaxRuntime &&
    !timedOutForNoOutput
      ? 0
      : 1;
  log(
    "runCursorSdkAttempt finished in " +
      String(Date.now() - S.activeAttemptStartedAt) +
      "ms (code=" +
      code +
      ", sawResult=" +
      sawResult +
      ", resultIsError=" +
      resultIsError +
      ", timedOutForNoOutput=" +
      timedOutForNoOutput +
      ", timedOutForMaxRuntime=" +
      timedOutForMaxRuntime +
      ", outputBytes=" +
      attemptOutput.length +
      (attemptErrorMessage ? ", runError=" + attemptErrorMessage : "") +
      ")",
  );
  return {
    code,
    terminatedBySignal: false,
    output: attemptOutput,
    timedOutForNoOutput,
    timedOutForMaxRuntime,
    timedOutForFirstEvent: false,
    timedOutForFirstAssistant: false,
    timedOutAfterFirstText: false,
    timedOutForZombie: false,
    toolStallErrorMessage: "",
  };
}
