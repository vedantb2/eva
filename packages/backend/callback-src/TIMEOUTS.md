# Callback timeout policy

Environment variables control watchdog and HTTP behavior for the sandbox callback script (`callback-src/`).

## CLI stdout / lifecycle

| Variable                                  | Default  | Purpose                                                  |
| ----------------------------------------- | -------- | -------------------------------------------------------- |
| `CLAUDE_NO_OUTPUT_TIMEOUT_MS`             | (unused) | Legacy env; idle stdout silence no longer kills the CLI. |
| `CLAUDE_FIRST_EVENT_TIMEOUT_MS`           | 90000    | Kill if no parseable stream-json line before this.       |
| `CLAUDE_FIRST_ASSISTANT_EVENT_TIMEOUT_MS` | 120000   | After Claude `system/init`, kill if no assistant event.  |
| `CLAUDE_MAX_TOTAL_RUNTIME_MS`             | 5400000  | Absolute callback+CLI runtime cap (~90 min).             |

Watchdog interval: `NO_OUTPUT_CHECK_INTERVAL_MS` = 5000 (fixed in `config.ts`).

While a tool is in flight, idle checks are skipped — only max runtime, zombie detection, and first-event/assistant guards apply. There is no per-tool stall kill and no idle stdout kill.

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

Quick tasks and automations use **both** the sandbox callback (this script) and, for tasks only, Convex heartbeat watchdogs.

| Layer                        | Owner                       | Quick-task values                   | Purpose                          |
| ---------------------------- | --------------------------- | ----------------------------------- | -------------------------------- |
| Callback `MAX_TOTAL_RUNTIME` | sandbox script              | 90m (`CLAUDE_MAX_TOTAL_RUNTIME_MS`) | Hard CLI lifetime cap            |
| sandbox sandbox autostop     | sandbox                     | 90m (ephemeral + session)           | Sandbox inactivity stop          |
| Convex `checkStaleRuns`      | `_taskWorkflow/watchdog.ts` | 5m / 25m tool-active                | Heartbeat staleness (tasks only) |
| `handleStaleRun`             | workflow                    | 2h                                  | Absolute backstop (tasks only)   |

Automations rely on callback timeouts only — no task watchdog.
