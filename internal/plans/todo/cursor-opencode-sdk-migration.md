# Cursor and OpenCode SDK Migration

> **Superseded — do not implement this plan.** The Cursor recommendation was
> replaced on 2026-07-31 by
> [`cursor-acp-adoption.md`](./cursor-acp-adoption.md) after a commit-pinned
> review of t3code and Cursor's now-stable ACP v1 documentation. The OpenCode
> work also needs a fresh, separate plan after Cursor; its versions and
> sequencing below are retained only as historical context.

## Summary

- Migrate both providers away from Eva-owned stdout parsing.
- OpenCode: use `@opencode-ai/sdk/v2` against an Eva-managed `opencode serve` process.
- Cursor: use `@cursor/sdk` in local mode with persistent SDK storage.
- This removes CLI output as Eva’s integration contract, but not every vendor executable: OpenCode’s SDK is an HTTP client for its server, and Cursor’s SDK may manage local agent processes internally.
- Sequence OpenCode first, then Cursor. OpenCode is the lower-risk migration; Cursor’s public-beta SDK gets a stricter go/no-go gate.
- Keep Claude and Codex unchanged.
- Run on the existing Vercel Sandbox Node 24 environment; no Daytona lifecycle or volume work. Vercel uses isolated Firecracker microVMs with Amazon Linux 2023 and persistent files across stop/resume. [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox)

## Implementation changes

### 1. Shared provider boundary

- Replace `CliAttemptResult` with a discriminated `ProviderAttemptResult` for `"legacy-cli"` and `"sdk"`.
- Every provider attempt returns a structured `ResultEvent`; only legacy adapters may parse stdout, and they do so once inside the adapter.
- Remove Cursor/OpenCode reparsing from final completion handling. Keep canonical events, streaming flushes, heartbeats, watchdogs, proof capture, commit gates, and completion mutations unchanged.
- Add provider flags:
  - `OPENCODE_ATTEMPT_MODE=cli|canary|sdk`
  - `CURSOR_ATTEMPT_MODE=cli|canary|sdk`
  - `OPENCODE_SDK_CANARY_PERCENT=0..100`
  - `CURSOR_SDK_CANARY_PERCENT=0..100`
- Canary assignment is a stable hash of the Eva session ID, so one conversation never changes transport unexpectedly.
- Add an optional provider-transport marker to the existing Convex session fields:
  - `cursor: "legacy-cli" | "sdk"`
  - `opencode: "legacy-cli" | "sdk"`
- Existing provider state without a marker is legacy. No CLI session ID may be silently interpreted as an SDK agent ID.
- Record transport, package/server version, startup time, first-event time, completion time, request/run ID, terminal status, and cancellation result. Never log prompts, credentials, or complete raw payloads.
- A preflight failure may fall back to CLI before a prompt is submitted. Once a provider accepts a prompt, never replay it automatically through another transport because that could duplicate edits or commands.

### 2. Vercel runtime and dependencies

- Change the generated callback target to Node 24, matching the active Vercel sandbox runtime.
- Pin initial versions exactly:
  - `@cursor/sdk@1.0.23`
  - `opencode-ai@1.17.18`
  - `@opencode-ai/sdk@1.17.18`
- Pin OpenCode CLI and SDK to the same release; do not use version ranges or auto-update.
- Install runtime packages in the Vercel seed snapshot and keep compile-time types in the backend package.
- Externalize packages that require runtime resolution from the callback bundle. Do not perform unpinned npm installation during an agent turn.
- Old sandboxes missing SDK packages remain on CLI. New SDK traffic only enters sandboxes built from the updated seed.
- Update stale documentation to describe Vercel Node 24 and add the architectural change to `internal/changelog.md`.

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
  - Otherwise permanently drain that conversation through the CLI path.
- This follows the useful parts of t3code: an explicit server owner, readiness gate, SDK client, subscription-before-prompt ordering, and scoped abort/cleanup. [OpenCode SDK](https://opencode.ai/docs/sdk/), [OpenCode server](https://opencode.ai/docs/server), [t3code runtime](https://github.com/pingdotgg/t3code/blob/main/apps/server/src/provider/opencodeRuntime.ts)

### 4. Cursor adapter

- Use the official TypeScript SDK in local mode with the Vercel workspace as `cwd`; do not use Cursor cloud agents.
- Create new SDK conversations with `Agent.create`; resume SDK conversations using their stored SDK agent identity.
- Use the SDK’s JSONL local-agent store under `/home/eva/.cursor-persist/sdk`, which survives Vercel stop/resume.
- Preserve `CURSOR_API_KEY`, model normalization, current system-prompt assembly, automatic tool approval semantics, and `.cursor/mcp.json`.
- Stream each run through its typed discriminated events and map assistant text, reasoning, tool lifecycle, usage, result, and errors to canonical events.
- Cancel with the SDK run cancellation API, wait for terminal settlement, and dispose run/agent resources in `finally`.
- Existing Cursor CLI conversations always stay on CLI until archived or deleted; do not attempt ID conversion.
- Before canary, prove that the SDK retains follow-up context after agent disposal and Vercel stop/resume. If it cannot, Cursor remains on CLI and ACP becomes a separate follow-up evaluation.
- t3code is not a Cursor SDK precedent: it launches `cursor-agent acp` and speaks typed ACP JSON-RPC. Reuse its serialization, cancellation, stable tool-ID, and cleanup ideas, but do not import its Effect/ACP framework into Eva. [Cursor SDK docs](https://cursor.com/docs/sdk/typescript), [Cursor SDK announcement](https://cursor.com/blog/typescript-sdk), [t3code Cursor ACP](https://github.com/pingdotgg/t3code/blob/main/apps/server/src/provider/acp/CursorAcpSupport.ts)

## Verification and rollout

- Unit tests:
  - Typed event-to-canonical mappings.
  - Cumulative-versus-delta text deduplication.
  - Interleaved and parallel tool calls.
  - Reasoning, usage, cost, errors, and terminal results.
  - Transport routing and legacy-state detection.
  - Cancellation, inactivity timeout, and cleanup.
  - Invalid open-ended tool payloads rejected through runtime validation without `any`, `unknown`, assertions, or non-null assertions.
- Contract tests with mocked SDK clients:
  - OpenCode subscribe-before-prompt, session filtering, abort, server failure, and compatibility probing.
  - Cursor create/resume, stream completion, cancellation, disposal, and store failure.
- Real Vercel Node 24 tests for each provider:
  - New conversation and multiple follow-ups.
  - File edit and shell command.
  - MCP tool invocation.
  - Model and system-prompt preservation.
  - Sandbox stop/resume.
  - Cancellation and inactivity timeout.
  - Authentication failure.
  - Server/process crash.
  - Proof capture and commit-gate regression.
- Cursor-specific gate: context, tool events, cancellation, MCP, and persistent resume must all pass before any production canary.
- Rollout independently per provider:
  1. CLI default; SDK enabled only for internal sessions.
  2. At least 20 successful scenario-complete turns.
  3. 10% of new eligible sessions for 48 hours.
  4. 50% for 48 hours.
  5. 100% for seven days.
- Advance only with:
  - No lost or duplicated canonical events.
  - No session-context regression.
  - Success and timeout rates no more than two percentage points worse than CLI baseline.
  - p95 first-event and completion latency no more than 20% worse.
  - No proof, commit-gate, or cancellation regression.
- Roll back by setting that provider to `cli`; do not migrate SDK-created conversations back to CLI.
- After seven stable days at 100%, retain legacy routing until all marked legacy sessions are archived/deleted. Then remove the provider’s CLI command builder, stdout parser, completion reparsing, and fallback flag in a dedicated cleanup change.
- Verification commands during implementation: targeted callback tests and `npx tsc`; no dev server, lint, or general build commands unless separately requested.

## Assumptions

- Recommended unanswered defaults are locked: managed OpenCode server plus per-turn Cursor SDK runs, compatibility-gated OpenCode migration, and legacy parser removal after canary and drain.
- Reliability is prioritized over initial latency improvement; persistent Cursor daemons are out of scope.
- t3code’s provider-driver concepts are adopted, but its WebSocket server, Effect framework, ACP implementation, permissions UI, and receipts system are not.
- No user-facing API or UI changes.
- Unresolved questions: none.
