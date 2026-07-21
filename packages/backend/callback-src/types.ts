/** JSON-compatible value for Convex HTTP payloads and stream events. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type StepOutput = {
  text: string;
  exitCode?: number;
  truncated?: boolean;
};

export type StepEdit = {
  oldText: string;
  newText: string;
};

/** Optional payload attached when a tool call finishes (merged onto the step). */
export type ToolCompleteResult = {
  output?: StepOutput;
  isError?: boolean;
  files?: string[];
  durationMs?: number;
};

export type ProgressStep = {
  type: string;
  label: string;
  detail?: string;
  /** Full, unshortened path for file-type steps. Powers the chat File Viewer. */
  path?: string;
  status: "active" | "complete";
  /** The tool_use id that produced this step (Claude only). Lets a tool_result
   * complete the exact step, and anchors nested subagent children. */
  toolUseId?: string;
  /** Set when this step ran inside a subagent — the parent `Agent` tool_use id.
   * The UI nests these under the matching `subtask` step. */
  parentToolUseId?: string;
  /** Todo checklist snapshot (type "todos" only), JSON-serialised for transport. */
  todos?: TodoItem[];
  /** Bash command (fuller than detail, capped). */
  command?: string;
  /** Tool result transcript (tail-capped). */
  output?: StepOutput;
  /** Edit before/after snippets (max 4). */
  edits?: StepEdit[];
  /** Codex file_change paths (max 10). */
  files?: string[];
  /** Write tool content head preview. */
  contentPreview?: string;
  /** True when the tool failed or exited non-zero. */
  isError?: boolean;
  /** Wall time from push → complete (ms). */
  durationMs?: number;
};

export type TodoItem = {
  content: string;
  status: "pending" | "in_progress" | "completed";
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
  | {
      kind: "complete_tool";
      trackingId?: string;
      result?: ToolCompleteResult;
    }
  | { kind: "mark_last_complete" }
  | { kind: "append_text"; text: string }
  | { kind: "stream_text_delta"; text: string }
  | { kind: "mark_message_start" }
  | { kind: "update_reasoning"; text: string }
  | { kind: "set_pending_question"; data: string }
  | { kind: "set_todos"; todos: TodoItem[] }
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
