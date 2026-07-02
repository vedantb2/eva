/** JSON-compatible value for Convex HTTP payloads and stream events. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type ProgressStep = {
  type: string;
  label: string;
  detail?: string;
  status: "active" | "complete";
};

export type SessionMode = {
  mode: "none" | "session" | "resume";
  sessionId: string | null;
};

export type StartupStep = {
  label: string;
  detail: string;
};

export type CanonicalEvent =
  | { kind: "update_thinking"; label: string; detail?: string }
  | { kind: "push_step"; step: ProgressStep; trackingId?: string }
  | { kind: "complete_tool"; trackingId?: string }
  | { kind: "mark_last_complete" }
  | { kind: "append_text"; text: string }
  | { kind: "update_reasoning"; text: string }
  | { kind: "set_pending_question"; data: string }
  | { kind: "set_codex_thread"; threadId: string }
  | { kind: "mark_first_assistant" };

export type StreamLineResult = {
  needsHeartbeat?: boolean;
};

export type CliAttemptOptions = {
  cmd: string;
  env: NodeJS.ProcessEnv;
  processLabel: string;
  attemptLabel: string;
  startupStep: StartupStep;
  onStart?: () => void;
  onStdoutText?: (text: string) => void;
};

export type CliAttemptResult = {
  code: number;
  output: string;
  timedOutForNoOutput: boolean;
  timedOutForMaxRuntime: boolean;
  timedOutForFirstEvent: boolean;
  timedOutForFirstAssistant: boolean;
  timedOutAfterFirstText: boolean;
  timedOutForZombie: boolean;
  toolStallErrorMessage: string;
};

export type ResultEvent = {
  result: string;
  isError: boolean;
  rawResultEvent: string;
};

export type AttemptHealthInput = {
  childPid: number | undefined;
  parsedEventsAtStart: number;
  attemptStartedAt: number;
  lastStdoutAt: number;
  processLabel: string;
  toolStallErrorMessage: string;
};

export type AttemptHealthResult = {
  shouldTerminate: boolean;
  timedOutForZombie: boolean;
  timedOutForMaxRuntime: boolean;
  timedOutForFirstEvent: boolean;
  timedOutForFirstAssistant: boolean;
  timedOutAfterFirstText: boolean;
  timedOutForNoOutput: boolean;
  toolStallErrorMessage: string;
  logMessage?: string;
};

export type ConvexCallType = "mutation" | "action";
