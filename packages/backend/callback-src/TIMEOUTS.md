# Callback timeout policy

Environment variables control watchdog and HTTP behavior for the sandbox callback script (`callback-src/`).

## CLI stdout / lifecycle

| Variable                                  | Default               | Purpose                                                                |
| ----------------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| `CLAUDE_NO_OUTPUT_TIMEOUT_MS`             | 60000                 | Kill CLI when stdout is silent this long (unless a tool is in flight). |
| `CLAUDE_FIRST_EVENT_TIMEOUT_MS`           | 90000                 | Kill if no parseable stream-json line before this.                     |
| `CLAUDE_FIRST_ASSISTANT_EVENT_TIMEOUT_MS` | 120000                | After Claude `system/init`, kill if no assistant event.                |
| `CLAUDE_POST_TEXT_STALL_TIMEOUT_MS`       | 90000                 | After first text block (non-Cursor), kill on prolonged silence.        |
| `CLAUDE_MAX_TOTAL_RUNTIME_MS`             | 3000000               | Absolute callback+CLI runtime cap (~50 min).                           |
| `CLAUDE_NON_SHELL_TOOL_TIMEOUT_MS`        | 300000                | Per-tool stall limit for read/search/edit tools.                       |
| `CLAUDE_SHELL_TOOL_TIMEOUT_MS`            | max(60000, MAX−60000) | Per-tool stall limit for bash/subtask.                                 |

Watchdog interval: `NO_OUTPUT_CHECK_INTERVAL_MS` = 5000 (fixed in `config.ts`).

## Convex HTTP

| Variable                                   | Default | Purpose                                                |
| ------------------------------------------ | ------- | ------------------------------------------------------ |
| `CALLBACK_HTTP_TIMEOUT_MS`                 | 18000   | Per-request fetch timeout.                             |
| `CALLBACK_HTTP_MAX_RETRIES`                | 4       | Retries for mutations/actions (`callConvexWithRetry`). |
| `CALLBACK_STREAMING_HEARTBEAT_MAX_RETRIES` | 4       | Retries per streaming heartbeat call.                  |

## Heartbeat fatal thresholds

| Variable                                   | Default | Purpose                                             |
| ------------------------------------------ | ------- | --------------------------------------------------- |
| `CALLBACK_HEARTBEAT_FATAL_BURST`           | 10      | Consecutive failures → terminate CLI.               |
| `CALLBACK_HEARTBEAT_FATAL_SLOW_COUNT`      | 8       | With slow window, consecutive failures → terminate. |
| `CALLBACK_HEARTBEAT_FATAL_SLOW_WINDOW_MS`  | 180000  | Window for slow fatal (covers Convex redeploy).     |
| `CALLBACK_HEARTBEAT_ABSOLUTE_MAX_FAILURES` | 28      | Hard cap on consecutive heartbeat failures.         |

## Buffers

| Variable                           | Default | Purpose                                               |
| ---------------------------------- | ------- | ----------------------------------------------------- |
| `CALLBACK_OUTPUT_BUFFER_MAX_BYTES` | 2000000 | Cap in-memory stdout/stderr; head trimmed, tail kept. |

Raw stdout is also appended to `/tmp/run-design.raw.jsonl`. Completion marker: `/tmp/run-design.done`.

## Overlap with Convex workflow watchdog

Quick tasks and automations use **both** the sandbox callback (this script) and, for tasks only, Convex heartbeat watchdogs. Tune these layers together — tightening one without the other can cause double-kills (e.g. 240s shell cap + 5m heartbeat).

| Layer                        | Owner                       | Quick-task values                   | Purpose                          |
| ---------------------------- | --------------------------- | ----------------------------------- | -------------------------------- |
| Callback `MAX_TOTAL_RUNTIME` | sandbox script              | 50m (`CLAUDE_MAX_TOTAL_RUNTIME_MS`) | Hard CLI lifetime cap            |
| Callback tool stall          | sandbox script              | ~MAX−60s (shell), 5m (non-shell)    | Kill stuck bash/grep/read        |
| Callback no-output           | sandbox script              | 60s when no tool in flight          | CLI died silently                |
| Convex `checkStaleRuns`      | `_taskWorkflow/watchdog.ts` | 5m / 25m tool-active                | Heartbeat staleness (tasks only) |
| `handleStaleRun`             | workflow                    | 2h                                  | Absolute backstop (tasks only)   |

Automations rely on callback timeouts only — no task watchdog.
