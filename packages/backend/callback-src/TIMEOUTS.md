# Callback timeout policy

Environment variables control watchdog and HTTP behavior for the sandbox callback script (`callback-src/`).

## CLI stdout / lifecycle

| Variable                                  | Default | Purpose                                                         |
| ----------------------------------------- | ------- | --------------------------------------------------------------- |
| `CLAUDE_NO_OUTPUT_TIMEOUT_MS`             | 60000   | Daemon-path message watchdog base (×5 in claudeSdkDaemon).      |
| `CLAUDE_STREAM_SILENCE_TIMEOUT_MS`        | 600000  | Kill a mid-turn stream silent this long with no tool in flight. |
| `CLAUDE_FIRST_EVENT_TIMEOUT_MS`           | 90000   | Kill if no parseable stream-json line before this.              |
| `CLAUDE_FIRST_ASSISTANT_EVENT_TIMEOUT_MS` | 120000  | After Claude `system/init`, kill if no assistant event.         |
| `CLAUDE_MAX_TOTAL_RUNTIME_MS`             | 5400000 | Absolute callback+CLI runtime cap (~90 min).                    |

Watchdog interval: `NO_OUTPUT_CHECK_INTERVAL_MS` = 5000 (fixed in `config.ts`).

While a tool is in flight, idle checks are skipped — only max runtime, zombie detection, and first-event/assistant guards apply. There is no per-tool stall kill. Idle stdout silence kills the CLI only past the generous `CLAUDE_STREAM_SILENCE_TIMEOUT_MS` cap (10 min — reinstated after a prod cursor:grok stream hung silently for 29 min; the old 45s kill removed in c8bb7fb8 stays dead).

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

Raw stdout is also appended to `/tmp/run-design.raw.jsonl`. Completion marker: `RUNNER_DONE_FILE`, set by the launcher to `/tmp/eva-runner.<entityIdField>-<entityId>.done` (see `convex/_sandbox_runtime/daemonPaths.ts`).

## Overlap with the Convex lease

Chat turns and task runs hold a Convex **lease**: a turn is running for exactly as long as its row holds an unexpired `leaseExpiresAt`. This script renews that lease on every heartbeat, and a 60s reconciler cron kills anything whose lease has lapsed. There is no per-turn watchdog chain.

| Layer                        | Owner                                           | Quick-task values                     | Purpose                                |
| ---------------------------- | ----------------------------------------------- | ------------------------------------- | -------------------------------------- |
| Callback `MAX_TOTAL_RUNTIME` | sandbox script                                  | 90m (`CLAUDE_MAX_TOTAL_RUNTIME_MS`)   | Hard CLI lifetime cap                  |
| Sandbox runtime cap          | Vercel                                          | Extended on every renewal             | VM killed at its deadline, no snapshot |
| Lease renewal                | `_chat/turnLease.ts`                            | 5m / 25m tool-active / 10m finalizing | Grace before the turn is declared dead |
| Lease reconciler             | `turns.reconcile`, `taskWorkflow.reconcileRuns` | 60s tick / 2h ceiling                 | Kills lapsed leases; absolute backstop |

A terminal renewal verdict (`superseded`, `cancelled`, `timeout`, `closed`) is an order to exit: the callback stops on the next heartbeat rather than living on as a zombie.

Automations hold no lease and rely on callback timeouts only.
