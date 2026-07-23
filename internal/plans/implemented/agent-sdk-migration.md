# Migrate the Claude provider off `claude -p` to the Claude Agent SDK

Status: DONE (2026-07-23). CLI spawn path removed; Claude runs only via
`@anthropic-ai/claude-agent-sdk`. `CLAUDE_ATTEMPT_MODE` is now `sdk` |
`sdk-daemon` (default `sdk-daemon`). Codex/OpenCode/Cursor keep their CLI
paths. Note: phase-1 plan text said flip default to `sdk`; production default
is `sdk-daemon` (persistent warm session).

Original plan status (superseded): WORKING on dev (branch `feat/agent-sdk-migration`, PR #423). Verified
end-to-end via the local dev server (dev deployment with
CLAUDE_ATTEMPT_MODE=sdk): new-session turn, tool-using turn with correct
activity, and multi-turn resume with session memory all pass. Prod untouched
(flag defaults to cli). Before flipping prod: rebuild the base Image so the SDK
is preinstalled, and soak on dev. Goal: run Claude via
`@anthropic-ai/claude-agent-sdk` `query()` in-process inside the callback,
instead of spawning the `claude -p` CLI. Keep all other providers (codex,
cursor, opencode) on their current CLI path. Flag-gated; not deployed to prod
until verified locally / in a test session.

## Why

- Programmatic control: thinking, tools, MCP, permissions, session resume as
  SDK options rather than CLI flags/env.
- Removes fragile CLI-string construction (`claudeBaseCmd` in config.ts) and the
  pgrep/marker/spawn plumbing specific to the Claude attempt.
- Foundation for a future persistent/warm session (near-instant turns).

## Key facts (from investigation)

- Current spawn: `runClaudeAttempt` (providers/attempts.ts) builds `cmd`
  (`cat prompt | claude -p ... --output-format stream-json`) and calls
  `runCliAttempt` (runtime/cliAttempt.ts) which `spawn`s bash → claude, streams
  stdout lines to `parseStreamEvent` → `claudeParseLine` → canonical events.
- The SDK `query({ prompt, options })` returns an async iterable of `SDKMessage`
  objects whose shapes mirror the CLI stream-json (`assistant`/`user`/`result`/
  `system` with the same `message.content` blocks). So `claudeParseLine` is
  largely REUSABLE against SDK messages — feed each SDKMessage to the same
  canonical mapping instead of `JSON.parse(line)`.
- Env/tokens already flow to the sandbox (GITHUB_TOKEN, MCP, sandbox JWT). The
  SDK needs an Anthropic API key (or the CLI's auth) — confirm which auth the
  sandbox has and wire it.

## Plan (incremental, flag-gated)

1. Add `@anthropic-ai/claude-agent-sdk` to `packages/backend` deps. Confirm exact
   package name + `query()` signature + `SDKMessage` union against official docs.
2. New module `callback-src/providers/claudeSdk.ts`: `runClaudeSdkAttempt()`
   that calls `query()` with options mapped from the existing config
   (model, systemPrompt, allowedTools, mcpServers, permissionMode=
   bypassPermissions, resume=sessionId) and iterates messages, routing each
   through the existing canonical mapping. Reuse the heartbeat/streaming/
   completion machinery from `runCliAttempt` where possible (extract shared
   parts rather than duplicate).
3. Adapter seam: an `ATTEMPT_MODE` (env `CLAUDE_ATTEMPT_MODE=sdk|cli`, default
   `cli`) in `providers/attempts.ts` so `runClaudeAttempt` dispatches to the SDK
   path only when opted in. Keeps prod on the CLI until proven.
4. Map SDK message → canonical: verify `claudeParseLine` handles the SDKMessage
   objects directly; where the SDK shape differs (e.g. it yields objects not
   strings, and may expose thinking as structured blocks), add a thin adapter.
5. Session resume + completion: wire `resume` for multi-turn, and detect the
   `result` message to finalize (mirror how the CLI `result` event is handled).
6. Tests: extend `callback-src/tests` with SDK-message → canonical cases
   (mirror the existing stream-json tests).
7. Local test harness: a script that runs `runClaudeSdkAttempt` against a real
   API key on a tiny prompt in a scratch repo, asserting canonical events +
   final text — so we can verify without a full sandbox. Then a real test eva
   session with `CLAUDE_ATTEMPT_MODE=sdk` set on the sandbox.
8. Rebuild `callbackScript.generated.ts`; typecheck; run callback tests.
9. Only after it works end-to-end in a test session: flip default to `sdk`,
   open for review. (Do NOT deploy to prod mid-migration.)

## Open questions / decisions to confirm during build

- Exact SDK package + `query()` API + `SDKMessage` union (verify vs docs).
- Sandbox auth for the SDK (API key vs CLI credential reuse).
- Whether the SDK bundles into the esbuild callback script cleanly, or must be
  an external dep (like `@daytonaio/sdk` in convex.json externalPackages) — the
  callback script is a single bundled file uploaded to the sandbox.
- Thinking: SDK can request thinking, but per product decision we are NOT
  surfacing reasoning — so leave thinking off (parity with current behaviour).

## Phase 2 — persistent warm-session daemon (the actual speed win)

Phase 1 reaches latency parity with `claude -p` (both spawn the CLI per turn).
Phase 2 keeps one `query()` warm across a session's turns so per-turn cost drops
to model time only. Design (grounded in the code):

Key fact: for a SESSION, `launchOnExistingSandbox` passes `entityId`,
`streamingEntityId`, `completionMutation` (`sessionWorkflow:handleCompletion`),
`entityIdField`, `model`, `allowedTools` all keyed to the session id — STABLE
across turns. **Only `prompt` varies.** So the daemon is started once with the
session's stable context and handed only the new prompt per turn.

Mechanism (mirrors t3code/synara):

- One `query({ prompt: AsyncIterable<SDKUserMessage>, options })` created once.
  The prompt is a queue-backed async generator that blocks (never returns) when
  idle, so the query — and its warm CLI subprocess + MCP + API connection —
  stays alive between turns. Each pushed user message is a new turn, ended by a
  `result` message.
- The callback becomes a loop: create warm query once; per turn { push prompt →
  consume messages until `result` → run the existing completion block (extracted
  into a per-turn function) → reset per-turn accumulators (S.accumulatedSteps,
  currentStreamedContent, resultEventSeen, timers) }; idle-exit after N minutes
  so the sandbox can be reclaimed.
- `launchOnExistingSandbox` handoff: if a daemon is alive for this sandbox
  (pidfile + `kill -0`) AND its entity matches, write the new prompt to a FIFO
  the daemon watches (fast, no respawn, no `pkill`); otherwise spawn fresh
  (first turn / after crash / entity mismatch).

Scope / safety:

- v1 gated behind `CLAUDE_ATTEMPT_MODE=sdk-daemon` (distinct from `sdk`), SESSION
  path only. All other flows and any non-session entity fall back to the
  one-shot SDK/CLI path unchanged.
- Fallback: on daemon crash / unhealthy pidfile, `launchOnExistingSandbox`
  respawns one-shot — never worse than today.
- Token lifetime: MCP token (8h) / sandbox token (24h) are set at daemon start;
  a session daemon older than the MCP token needs a refresh-or-recycle (v1: recycle
  the daemon when the token nears expiry).

Build order: (1) extract index.ts per-turn completion into a function (pure
refactor, verify identical one-shot behaviour); (2) daemon loop + queue-fed
query; (3) FIFO handoff in launchOnExistingSandbox; (4) idle-exit + crash
fallback; (5) dev test: measure turn-2+ latency vs phase 1.

## Testing target

"Moved off `claude -p`": a test eva session running with the SDK path completes
a multi-turn task (tool use + final response) with correct activity + no
regressions, verified locally/in-session before any prod default flip.
