# OpenCode SDK Migration

> Status note (5 August 2026): the Cursor half of this plan shipped — Cursor now
> runs on `@cursor/sdk` via `callback-src/providers/cursorSdk.ts` (direct swap,
> no canary flags or transport markers; pre-migration CLI session ids self-heal
> to fresh SDK agents). See `internal/changelog.md`. What remains below is the
> OpenCode half only. When picking it up, reconsider the canary machinery: the
> Cursor migration skipped it (rollback = git revert, callback ships per launch)
> and that trade held.

## Summary

- Migrate OpenCode away from Eva-owned stdout parsing.
- Use `@opencode-ai/sdk/v2` against an Eva-managed `opencode serve` process.
- This removes CLI output as Eva's integration contract; OpenCode's SDK is an HTTP client for its server.
- Keep Claude, Codex, and Cursor unchanged.
- Run on the existing Vercel Sandbox Node 24 environment. Vercel uses isolated Firecracker microVMs with Amazon Linux 2023 and persistent files across stop/resume. [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox)

## Implementation changes

### 1. Provider boundary

- Every provider attempt returns a structured `ResultEvent`; only legacy adapters may parse stdout, and they do so once inside the adapter.
- Remove OpenCode reparsing from final completion handling. Keep canonical events, streaming flushes, heartbeats, watchdogs, proof capture, commit gates, and completion mutations unchanged.
- Precedent from the Cursor migration: a synthetic `{type:"result"}` line pushed through the existing pipeline (carrying real usage) avoids new completion plumbing.

### 2. Vercel runtime and dependencies

- Pin initial versions exactly: `opencode-ai@1.17.18`, `@opencode-ai/sdk@1.17.18` (re-check latest at implementation time).
- Pin OpenCode CLI and SDK to the same release; do not use version ranges or auto-update.
- Install runtime packages in the Vercel seed snapshot and keep compile-time types narrow and hand-written in callback-src (the `claudeSdk.ts` / `cursorSdk.ts` loader pattern: dynamic import from the global npm root, one-time user-prefix fallback install).
- Old sandboxes missing SDK packages get the fallback install path.

### 3. OpenCode adapter

- Add a race-safe sandbox runtime manager for `opencode serve`:
  - Bind only to `127.0.0.1`.
  - Use a stable local port and an atomic startup lock.
  - Probe `/global/health` and verify the server version before use.
  - Reuse one healthy server per Vercel sandbox.
  - Restart it after sandbox resume or process death.
  - Retain a bounded stderr buffer for diagnostics.
- Preserve the existing OpenCode home, auth, config, model mapping, permissions, working directory, MCP configuration, and prompt assembly.
- Connect with `createOpencodeClient`; subscribe to the event stream before calling `session.promptAsync`.
- Filter events by OpenCode session ID and workspace directory.
- Map typed SDK events into Eva canonical events:
  - Assistant and reasoning text.
  - Tool start/update/completion/failure with stable tool IDs.
  - Todo snapshots and step completion.
  - Usage, cost, terminal result, abort, and session errors.
- Track emitted text per part so cumulative `message.part.updated` events do not duplicate streamed content.
- On timeout or cancellation, call `session.abort`, close the subscription, then use process termination only if the server is unresponsive.
- Existing OpenCode conversations:
  - Before sending a prompt, perform a read-only `session.messages` compatibility check.
  - Promote the state to SDK only when the session exists and expected history is present.
  - Otherwise permanently drain that conversation through the CLI path — or adopt the Cursor precedent (hard cutover with resume self-heal) if a one-time context reset is acceptable.
- This follows the useful parts of t3code: an explicit server owner, readiness gate, SDK client, subscription-before-prompt ordering, and scoped abort/cleanup. [OpenCode SDK](https://opencode.ai/docs/sdk/), [OpenCode server](https://opencode.ai/docs/server), [t3code runtime](https://github.com/pingdotgg/t3code/blob/main/apps/server/src/provider/opencodeRuntime.ts)

## Verification

- Unit tests: typed event-to-canonical mappings, cumulative-versus-delta text deduplication, interleaved and parallel tool calls, reasoning, usage, cost, errors, terminal results, cancellation, inactivity timeout, cleanup.
- Contract tests with a mocked SDK client: subscribe-before-prompt, session filtering, abort, server failure, compatibility probing.
- Real Vercel Node 24 tests: new conversation and follow-ups, file edit and shell command, MCP tool invocation, model and system-prompt preservation, sandbox stop/resume, cancellation and inactivity timeout, authentication failure, server/process crash, proof capture and commit-gate regression.
- Targeted callback tests and `npx tsc`; no dev server, lint, or general build commands unless separately requested.

## Assumptions

- Reliability is prioritised over initial latency improvement.
- t3code's provider-driver concepts are adopted, but its WebSocket server, Effect framework, ACP implementation, permissions UI, and receipts system are not.
- No user-facing API or UI changes.
