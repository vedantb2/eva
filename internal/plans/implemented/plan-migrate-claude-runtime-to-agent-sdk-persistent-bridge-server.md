# Plan: Migrate Claude runtime to Agent SDK + persistent bridge server

## Context

Today `callbackScript.ts` spawns `claude -p --output-format stream-json` per message inside the Daytona sandbox. Anthropic announced `--bare` becomes the default for `-p` in a future release — silently drops CLAUDE.md, settings, MCP unless we pass explicit flags. Separately, every message pays full Claude CLI cold-start (~3-6s: node boot, auth read, MCP probe, session resume disk I/O) because each `-p` invocation is a fresh process.

Migrating to the Anthropic Agent SDK (`@anthropic-ai/claude-agent-sdk`) sidesteps `--bare` entirely (the flag is CLI-only) and gives us a programmatic message loop we can host inside a long-lived process. A persistent bridge server baked into the snapshot keeps one Node process warm per sandbox, holds MCP connections open, and cuts per-message latency to just the model TTFT.

Scope: `packages/backend` + `apps/web`. Out of scope: desktop app, teams-bot. Ship Phase A + B + C together in one release behind feature flag `EVA_CLAUDE_RUNTIME=bridge`.

## Recommended approach

**Three phases, one release.** Phase A bakes SDK into snapshot. Phase B adds an SDK-based execution path. Phase C wraps that path in a persistent HTTP server started at sandbox boot. Feature-flag the caller so we can fall back to CLI mode on regression.

### Phase A — snapshot prep

Add `@anthropic-ai/claude-agent-sdk` to the global npm install so it's available to both the callback script and the bridge server without runtime fetching.

- **Edit** `packages/backend/convex/snapshotActions.ts:69`
  - Append `@anthropic-ai/claude-agent-sdk` to the `npm install -g` list
- **Rebuild snapshot** via existing `snapshotActions` flow

### Phase B — SDK execution path in callbackScript

Replace the Claude branch of the CLI dispatch with a programmatic SDK call. Keep CLI paths for other providers (codex, opencode, cursor) unchanged.

- **Edit** `packages/backend/convex/_daytona/callbackScript.ts`
  - Add `runClaudeSdkAttempt(opts)` (~280 lines) sibling to existing `runClaudeAttempt` around line 2762
  - Dynamic `import("@anthropic-ai/claude-agent-sdk")` (no bundler changes)
  - Call `query({ prompt, options })` with:
    - `systemPrompt: { type: "preset", preset: "claude_code", append: SYSTEM_PROMPT, excludeDynamicSections: true }` — preserves CLAUDE.md behavior
    - `permissionMode: "bypassPermissions"` — matches current `--dangerously-skip-permissions`
    - `allowedTools` from existing `allowedTools` arg (default `"Read,Glob,Grep,Skill"`)
    - `mcpServers` parsed from `/tmp/eva-mcp.json` (existing path)
    - `cwd: WORK_DIR`
    - `model: args.model`
    - `resume`/`forkSession` from `resolveClaudeSessionMode()` (lines 1770-1850) — reuse existing logic unchanged
    - `settingSources: ["user", "project", "local"]` — SDK default, preserves settings loading
    - `abortController` wired to existing watchdog timeouts (NO_OUTPUT_TIMEOUT_MS, FIRST_EVENT_TIMEOUT_MS, POST_TEXT_STALL_TIMEOUT_MS, MAX_TOTAL_RUNTIME_MS)
  - **SDKMessage → activity-step adapter**: reuse `parseStreamEvent()` at lines 620-825. SDK emits same event shapes as `stream-json` (`assistant`, `user`, `result`, `system`). Thin wrapper to normalize field names where they differ.
  - Heartbeat + completion mutations unchanged — adapter produces same activity-step shape
  - Cancel: replace `pkill` (execution.ts:651-655) with `abortController.abort()` via bridge RPC in Phase C; in Phase B standalone mode keep `pkill` as fallback
- **Feature flag**: dispatch branch in `runProviderAttempt` (line 2885) reads `process.env.EVA_CLAUDE_RUNTIME` — `"cli"` (default) → existing path, `"sdk"` → new path, `"bridge"` → Phase C path

### Phase C — persistent bridge server

Long-lived Node HTTP server baked into snapshot at `/home/eva/claude-bridge/server.mjs`. One warm process per sandbox, keeps SDK + MCP connections loaded. Callback script talks to it via `curl` over executeCommand (no preview URL signing).

- **New file** `packages/backend/convex/_daytona/bridgeServer.ts`
  - Exports `BRIDGE_SERVER_SCRIPT` template string (same pattern as `CALLBACK_SCRIPT`)
  - Node HTTP server on `127.0.0.1:7777` (IPv4 only per CLAUDE.md)
  - Endpoints:
    - `POST /message` `{ sessionId, prompt, options, runId }` → kicks SDK `query()`, returns immediately
    - `GET /stream/:runId` → chunked NDJSON of SDK messages as they arrive (long-poll)
    - `POST /cancel/:runId` → `abortController.abort()`
    - `GET /health` → `{ ok: true, uptime, activeRuns }`
    - `POST /preload` → warms SDK + MCP without sending a prompt
  - Per-run state: `Map<runId, { abort, eventBuffer, subscribers, done }>`
  - Per-session resume state cached in-memory; persists to `/home/eva/.claude-persist/claude-sessions/{kind}/{sessionHash}` (existing volume mount, volumes.ts:154-177)
- **Edit** `packages/backend/convex/snapshotActions.ts`
  - After npm install, upload `BRIDGE_SERVER_SCRIPT` to `/home/eva/claude-bridge/server.mjs`
  - Add bridge autostart to `/home/eva/.profile`: `nohup node /home/eva/claude-bridge/server.mjs > /tmp/bridge.log 2>&1 & disown` (wrapped with restart loop)
- **Edit** `packages/backend/convex/_daytona/execution.ts`
  - In `runStartupCommands` (lines 80-148), confirm bridge is up via `curl -sf http://127.0.0.1:7777/health` before marking `/tmp/.startup-commands-done`
- **Edit** `packages/backend/convex/_daytona/callbackScript.ts`
  - Add `runClaudeBridgeAttempt(opts)` — calls `executeCommand` with `curl -X POST http://127.0.0.1:7777/message -d @/tmp/bridge-req.json`, then `curl -N http://127.0.0.1:7777/stream/:runId` for NDJSON stream
  - Parser reuses same adapter as Phase B (SDKMessage → activity step)
  - Cancel path: `curl -X POST http://127.0.0.1:7777/cancel/:runId`
- **No Convex schema changes** — bypass-only permission mode, no approval UI this release
- **No desktop changes**

## Critical files

| File                                                 | Phase | Change                                                               |
| ---------------------------------------------------- | ----- | -------------------------------------------------------------------- |
| `packages/backend/convex/snapshotActions.ts`         | A + C | npm install line + bridge script upload + .profile autostart         |
| `packages/backend/convex/_daytona/callbackScript.ts` | B + C | Add `runClaudeSdkAttempt` + `runClaudeBridgeAttempt` + dispatch flag |
| `packages/backend/convex/_daytona/bridgeServer.ts`   | C     | New file — `BRIDGE_SERVER_SCRIPT` template                           |
| `packages/backend/convex/_daytona/execution.ts`      | C     | Health check before startup-done marker; keep `pkill` fallback       |
| `packages/backend/convex/_daytona/volumes.ts`        | —     | No change — reuse `/home/eva/.claude-persist` mount                  |
| `packages/backend/convex/_daytona/launch.ts`         | —     | No change — still uploads prompt + runs callback script              |

## Reuse

- `resolveClaudeSessionMode()` (callbackScript.ts lines 1770-1850) — resume/fork logic
- `parseStreamEvent()` (callbackScript.ts lines 620-825) — event dispatcher, adapt don't rewrite
- `sessionClaudeUuid()` (volumes.ts lines 65-77) — deterministic session hash
- `WORK_DIR`, `LEGACY_WORKSPACE_DIR`, `WORKSPACE_DIR` constants from `_daytona/helpers.ts`
- Existing watchdog timeout constants
- Existing completion mutation (`messages:updateLastInternal`) — no signature change
- Existing streaming heartbeat (`streaming:set`) — no signature change

## Rollout

1. Deploy Convex with `EVA_CLAUDE_RUNTIME=cli` default (no behavior change)
2. Build new snapshot (Phase A + Phase C assets baked in)
3. Flip env var per-repo to `bridge` on one test repo
4. Watch `/tmp/bridge.log` + existing activity-log stream for parity
5. Gradual rollout by repo, fall back to `cli` on regression

## Verification

- **Snapshot build**: `cd packages/backend && npx convex run snapshotActions:buildSnapshot` succeeds; inspect new snapshot has `@anthropic-ai/claude-agent-sdk` at `/usr/lib/node_modules/` and `/home/eva/claude-bridge/server.mjs` exists
- **Typecheck**: `cd packages/backend && npx convex codegen --typecheck enable` passes
- **Bridge health**: launch sandbox, exec `curl -sf http://127.0.0.1:7777/health` returns `{ok:true}` within 5s of boot
- **SDK parity end-to-end**: send identical prompt via `cli` and `bridge` runtimes, compare streamed activity log shapes — assistant/user/result/system events should produce same activity-step array
- **Watchdog**: prompt that stalls after first tool call — verify NO_OUTPUT_TIMEOUT abort triggers and `messages:updateLastInternal` called with `errorDetail`
- **Cancel**: from `apps/web` ChatPanel hit cancel mid-run — verify `runClaudeBridgeAttempt` receives abort, Convex message marks finished
- **Session resume**: two messages in same session, confirm SDK logs show `resume` on 2nd run with session id from `claude-sessions/{kind}/{sessionHash}`
- **Latency**: time from `POST /message` → first `assistant` event on bridge runtime should be ≤1.5s (vs ~4s on cli cold start)

## Non-goals this release

- Per-tool approval UI (`canUseTool` + `pendingPermissions` table) — stays on `bypassPermissions`
- Desktop app migration — stays on local Claude CLI
- Teams-bot — untouched
- Image attachment support from user input — existing out-bound attachment flow unchanged
