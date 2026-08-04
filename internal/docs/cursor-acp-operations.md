# Cursor ACP architecture and operations

Date: 2026-07-31
Owner: Agent runtime

## Contract

Eva runs Cursor through the official `@agentclientprotocol/sdk` and the `cursor-agent acp` stdio process. Cursor does not use the legacy `cursor-agent -p --output-format stream-json` command, its parser, or an automatic fallback.

Convex remains the durable workflow, queue, identity, and recovery owner. ACP is the typed provider boundary. Eva deliberately does not adopt Effect, t3code's private ACP package, WebSocket command bus, SQLite event store, or desktop-login architecture.

Primary references:

- [ACP v1 overview](https://agentclientprotocol.com/protocol/v1/overview)
- [ACP prompt turns](https://agentclientprotocol.com/protocol/v1/prompt-turn)
- [ACP session configuration](https://agentclientprotocol.com/protocol/v1/session-config-options)
- [Cursor ACP documentation](https://cursor.com/docs/cli/acp)

## Runtime lifecycle

One warm Cursor daemon is owned by each active chat entity:

1. Convex launches or prewarms the generated callback bundle in the sandbox.
2. The callback starts `cursor-agent acp` with newline-delimited JSON-RPC over stdio.
3. The client sends `initialize` for ACP v1, advertises boolean configuration support and Cursor's parameterized model picker metadata, then authenticates.
4. It loads the durable Cursor ACP session when one exists or creates a new session with the workspace and MCP descriptors.
5. Replayed load updates are isolated from live-turn output. Only updates for the current session and prompt generation reach the current assistant row.
6. The daemon polls the surface's `claimPendingTurn` mutation. A claim succeeds only for the current callback protocol version and expected model.
7. Immediately before each `session/prompt`, Eva validates and applies the exact model, advertised config options, and mode captured on that turn.
8. `session/update` drives message, thought, tool, todo, plan, subagent, generated-image, and question UI. Stable ACP tool-call IDs merge updates without duplicate steps.
9. The response to that exact `session/prompt` is the completion authority. Process exit and the last-looking stream event are not completion signals.
10. The daemon reconciles streaming before exact completion, then waits for another claimed turn. It exits after 45 minutes idle or drains after the callback fingerprint changes.

The durable Cursor session ID survives callback or sandbox process restarts. A warm child is a latency optimization, not the source of conversation truth.

## Per-turn capabilities

At startup, the authenticated ACP client discovers and sanitizes:

- `cursor/list_available_models` results;
- session configuration options, including model-specific options;
- available ACP modes.

It stores a six-hour capability snapshot scoped to the exact team repo or personal Cursor provider account plus CLI version. The browser uses that snapshot to disable unavailable static models and expose normalized reasoning, thinking, context, and mode controls.

Before every prompt, the runtime reapplies the turn's complete settings. This is required because one daemon serves multiple queued turns and must not inherit a previous turn's model, reasoning level, context, or mode. Unsupported requested settings fail clearly before prompt submission rather than being silently ignored.

The UI knows normalized Eva traits; only the backend ACP adapter knows Cursor option IDs and raw model IDs.

## Cancellation and blocking requests

Stop sends `session/cancel` first. The daemon waits for the active `session/prompt` to settle and gives Cursor a bounded cancellation window. Process teardown is the safety fallback for an unresponsive child, not normal cancellation.

Permission requests follow Eva's configured policy. `cursor/ask_question` posts one exact pending question and waits for the matching answer. `cursor/create_plan`, todos, subagent completion, and generated images are translated into visible activity. Teardown settles pending interactions so the provider cannot remain deadlocked.

## Upgrade and recovery behavior

The callback bundle writes its fingerprint and daemon markers in `/tmp`. A daemon that sees a new fingerprint stops accepting claims, finishes or cancels its current exact turn, removes its markers, and exits. A replacement daemon then starts with the current bundle.

Recovery rules:

- Before `session/prompt` is accepted, a setup failure may be retried for the same durable turn.
- After prompt acceptance is possible, do not automatically replay through ACP or another transport. Cursor may already have edited files, called MCP tools, committed, or recorded media.
- A lost process may reload the durable Cursor session for future turns, but the ambiguous failed turn is surfaced to the user for an explicit retry.
- Completion, watchdog, and pending-question recovery must still match the exact chat tuple described in `internal/docs/exact-turn-chat-lifecycle.md`.
- The sandbox and branch remain available when publish fails so commits can be recovered without rerunning the agent.

## Operational diagnostics

Useful log phrases:

```text
cursor_acp daemon warm
cursor_acp daemon turn finalized
cursor_acp daemon cancellation sent
cursor_acp daemon callback script changed; draining current turn
cursor_acp daemon idle timeout
Cursor negotiated unsupported ACP version
chat.stale_callback_ignored
claimPendingTurn model mismatch
```

For a stuck or incorrect Cursor turn, inspect in this order:

1. The entity's exact `activeTurn` and `pendingTurn`.
2. Whether the callback protocol version matches the claim.
3. Daemon PID/entity/options markers and callback fingerprint.
4. The durable Cursor ACP state and session ID.
5. `session/prompt` acceptance, stop reason, cancellation, and any blocking question.
6. Structured stale-callback events for the expected/received tuple.
7. The provider capability snapshot for the selected account and CLI version.

If an old daemon is draining, let its exact active turn settle or cancel it; do not start a second provider process for the same turn. If no active turn exists, removing stale process markers and relaunching the current callback is safe through the normal launch/prewarm path.

## Verification gates

Changes to Cursor ACP should keep these checks green:

- callback and Convex TypeScript checks;
- Cursor capability mapping and sanitization tests;
- claim parsing, replay isolation, question, cancellation, and ACP result tests;
- shared exact-turn lifecycle and callback identity tests;
- full backend and web suites;
- generated callback bundle fingerprint refresh;
- a real authenticated sandbox probe before changing vendor-specific assumptions.

Never add an automatic stream-JSON fallback. A rollback may stop new Cursor submissions or roll future turns to a known build only after identified work drains; it must never execute one accepted turn twice.
