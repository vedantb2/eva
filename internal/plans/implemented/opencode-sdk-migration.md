# OpenCode SDK Migration

> Status (14 August 2026): fully researched and ready to implement in a fresh
> session. OpenCode is the LAST provider on CLI subprocess execution — Claude
> (Agent SDK), Codex (`@openai/codex-sdk`, 5 Aug) and Cursor (`@cursor/sdk`,
> 5 Aug) all run in-process. The Cursor migration is the template: direct swap,
> no canary flags, rollback = git revert (callback ships per launch), resume
> self-heal instead of compatibility drains. That trade held; reuse it.

## Summary

- Replace `runCliAttempt`-based OpenCode execution with a one-shot SDK runner
  (`providers/opencodeSdk.ts`) modeled on `cursorSdk.ts`.
- Use `@opencode-ai/sdk` against an Eva-managed `opencode serve` process
  (one healthy server per sandbox, restarted on resume/death).
- Remove the opencode branch from completion-time stdout reparsing by pushing a
  synthetic `{type:"result"}` line (Cursor/Codex precedent).
- Keep Claude, Codex, Cursor unchanged. No UI, schema, or auth changes.
- After this lands, `runtime/cliAttempt.ts` shrinks to shared helpers
  (`resetAttemptState`, `evaluateAttemptHealth`) — see task chip
  "Shrink cliAttempt.ts once opencode leaves it".

## Current state (verified 14 Aug 2026, with file:line)

### Execution path today

- `providers/attempts.ts:60-79` `runOpencodeAttempt`: builds
  `opencodePromptCmd | opencodeExecBaseCmd [-s <sessionId>]` and calls
  `runCliAttempt` (bash subprocess, stdout piped through
  `processRealtimeStdoutChunk`). Routing at `attempts.ts:91-96`.
- `config.ts:303-314`: `opencodePromptCmd` (cat `/tmp/design-prompt.txt`,
  system prompt prepended via `printf`), `opencodeExecBaseCmd`
  (`opencode run --format json --model <normalizedOpencodeModel>`).
  `normalizedOpencodeModel` (`config.ts:255-257`) strips the `opencode:` prefix
  from `MODEL`.
- `config.ts:133-152` OPENCODE_* constants: `OPENCODE_RUNTIME_HOME_DIR`
  (`/tmp/opencode-home`), `OPENCODE_PERSIST_DIR` (`/home/eva/.opencode-persist`),
  `OPENCODE_BIN_PATH` (`EVA_OPENCODE_BIN_PATH` or `/tmp/opencode-cli/bin/opencode`),
  local/persist `session-state.json` paths, `OPENCODE_CONFIG_JSON[_BASE64]`,
  `OPENCODE_AUTH_DIR`/`FILE` (`/home/eva/.local/share/opencode/auth.json`),
  `OPENCODE_AUTH_JSON[_BASE64]`.

### Session state

- `session/opencodeSession.ts` via shared `createSessionStore`
  (`resumeField: "resumeSessionId"`, `S.activeOpencodeSessionId`). Persists
  `session-state.json` plus `auth.json` to the persist volume on sync
  (lines 35-42).
- `hydratePersistedOpencodeState` (lines 44-69): decodes config/auth env into
  files, forces `OPENCODE_PERMISSION='"allow"'` and
  `OPENCODE_DISABLE_AUTOUPDATE="1"`.
- `prepareOpencodeSessionState` (lines 71-89): blind resume — passes `-s <id>`
  with NO self-heal. Session id captured live from stdout
  (`providers/opencode.ts` `onStreamLine` sets `S.activeOpencodeSessionId`).

### Stream parsing (the part the SDK replaces)

- `providers/opencode.ts` `opencodeParseLine` (lines 11-91) maps the CLI's
  `--format json` JSONL: `"reasoning"` → `update_reasoning`, `"text"` →
  `append_text`, `"tool_use"` with `state.status === "running"` → `push_step`
  (via `opencodeToolToStep`, `parse/toolSteps.ts:12+`), `"completed"|"error"` →
  `complete_tool` (result via `probeOpencodeStateResult`,
  `parse/toolResultCapture.ts:253+`: reads `state.output/error`,
  `metadata.exit`, `time.start/end`). `"step_finish"` with `reason === "stop"`
  → `mark_last_complete`, sets `S.resultEventSeen`, syncs session state.
- Registered as `opencodeAdapter` in `providers/index.ts:14`.
- `runtime/completion.ts:217-333`: the WHOLE raw stdout is reparsed a second
  time at completion to build the final `ResultEvent` (tokens/cost from
  `step_finish`, text accumulation per `messageID`, `type:"error"` lines →
  `isError`). This branch gets DELETED; the runner pushes a synthetic result
  line instead (Cursor's branch at ~150-215 is the pattern).

### cliAttempt surface

- `runCliAttempt` (`runtime/cliAttempt.ts:140`) and `evaluateAttemptHealth`
  (line 29, keys on a real child pid) are CLI-only; opencode is their last
  caller. `resetAttemptState` (line 124) is shared — every SDK runner calls it;
  the new runner must too.
- Types in `callback-src/types.ts`: `ProviderAttemptResult` (109-120, the
  return shape), `SessionMode` (67-70), `ResultEvent` (122-126).

### Sandbox provisioning

- Seed snapshot: `convex/snapshotActions.ts:75` pins `OPENCODE_VERSION =
  "1.18.16"` — pinned SEPARATELY from other CLIs because `1.18.17`/`latest`
  broke fresh snapshots (launcher/platform-package lockstep, comment at 72-74).
  Install at line 359: `sudo npm install -g opencode-ai@${OPENCODE_VERSION}`.
  Contract test `tests/seedRunGithubReleaseCurlContract.test.ts:102-110`
  asserts the separate pin.
- Runtime fallback: `convex/_sandbox_runtime/launch.ts:74-83`
  `ensureOpencodeCliAvailable` (npm install to `/tmp/opencode-cli` for old
  snapshots); env injection at 233-235. Cursor's case in
  `ensureProviderCliAvailable` (line 95) is a no-op because its SDK
  self-installs — the end state opencode should reach for the SDK half (the
  CLI stays for `opencode serve`).
- Cleanup/liveness that key on the CLI invocation:
  `_sandbox_runtime/lifecycle.ts:25` (`pkill -x opencode`) and
  `_sandbox_runtime/helpers.ts:25` (`pgrep -f '... opencode run ...'`) — the
  pgrep pattern MUST change (no more `opencode run`; the long-lived process is
  `opencode serve`, and the turn itself is the callback node process).

### Routing / daemon status

- No opencode daemon exists and none is needed: `callback-src/index.ts:94-103`
  starts warm daemons only for claude/codex; opencode chat turns run one-shot
  per turn (`usesChatDaemon` in `convex/_validators/aiModels.ts:543-546`
  returns claude||codex; `convex/projectChatWorkflow.ts:224`). Quick tasks and
  automations are always one-shot. First cut stays one-shot like Cursor; the
  `opencode serve` process manager is per-sandbox infrastructure, not an Eva
  daemon, so `index.ts` needs no new branch.

### Untouched by this migration

UI (model pickers, `knownEnvVars.ts`, logos, `SetupBanner.tsx`), Convex schema
and zod enums, availability gating (`OPENCODE_AUTH_ENV_KEYS`,
`aiModels.ts:413-441`), and auth env flow are provider-agnostic and correct
as-is. `hydratePersistedOpencodeState` keeps writing `auth.json`/config —
the server reads the same files.

## SDK facts (from opencode.ai/docs, 14 Aug 2026 — re-verify at implementation)

- Package `@opencode-ai/sdk` (the old plan said `/v2`; check the current
  entrypoint). Pin CLI and SDK to the SAME release; re-check the latest safe
  version — the 1.17.18 pin in the old plan is stale, seed currently pins CLI
  1.18.16 and 1.18.17 was broken.
- `createOpencodeClient({ baseUrl, throwOnError })` connects to an existing
  server — this is what we use against our managed `opencode serve`
  (`--port`, `--hostname 127.0.0.1`; auth via `OPENCODE_SERVER_PASSWORD` /
  `OPENCODE_SERVER_USERNAME` env if we want it — localhost-only may suffice,
  decide at implementation). `createOpencode()` can spawn server+client in one
  call but hides the process; we want to own the process for restart/reuse.
- Sessions: `session.create`, `session.get({path:{id}})`,
  `session.messages({path:{id}})`, `session.prompt({path, body})` (body:
  `model: {providerID, modelID}`, `parts: [{type:"text", text}]`),
  `session.abort({path:{id}})`.
- Events: `client.event.subscribe()` → async-iterable SSE stream (`/event`
  endpoint; first event `server.connected`, then bus events —
  `message.part.updated`, `session.idle`, `session.error`, permission events).
  The docs do not enumerate part/event schemas; get them from the SDK's
  TypeScript types (`Part`, `Message`, tool parts carry the same
  `state.{status,input,output,metadata,time}` shape the CLI JSONL has today).
  Subscribe BEFORE prompting; filter events by session id.
- `client.auth.set` exists but we keep file-based auth (`auth.json`) — the
  server picks it up from `OPENCODE_AUTH_DIR`.

## Implementation steps

### 1. Pin and install the SDK

- Choose one version for `opencode-ai` + `@opencode-ai/sdk` (same release).
  Respect the lockstep hazard: test a fresh seed snapshot before bumping the
  existing 1.18.16 CLI pin.
- `convex/snapshotActions.ts`: add the SDK to the global npm install (its own
  line or the shared SDK line 358 — but keep the opencode CLI pin separate so
  the contract test still passes; extend the test if the SDK gets its own pin).
- `providers/opencodeSdk.ts`: `loadOpencodeSdk()` copying the
  `cursorSdk.ts:132-164` loader — dynamic import from `globalNpmRoot()`
  (import helper from `claudeSdk.ts`), one-time fallback
  `npm install --prefix /home/eva/.eva-agent-sdk @opencode-ai/sdk@<pin>` for
  old snapshots. Hand-written narrow types in callback-src; no repo
  package.json dep (matches cursor/claude pattern; codex is the outlier).

### 2. Server manager (`opencode serve` per sandbox)

New module (e.g. `providers/opencodeServer.ts`):

- Spawn `<OPENCODE_BIN_PATH> serve --hostname 127.0.0.1 --port <stable port>`
  with `HOME=/tmp/opencode-home`, cwd = `WORK_DIR`, existing env (auth/config
  already hydrated by `hydratePersistedOpencodeState`).
- Atomic startup lock (mkdir/pidfile — see the daemon pidfile fencing in
  `claudeSdkDaemon.ts` for prior art), health-probe with retry before use,
  verify server version matches the pin, reuse if already healthy, restart
  after sandbox resume or process death. Bounded stderr ring buffer for
  diagnostics.
- Cleanup: update `_sandbox_runtime/lifecycle.ts:25` pkill and
  `_sandbox_runtime/helpers.ts:25` pgrep to the new process shapes
  (`opencode serve`; liveness of a turn = the callback process, not the CLI).

### 3. The runner (`providers/opencodeSdk.ts` → `runOpencodeSdkAttempt`)

Skeleton = `cursorSdk.ts:339+`:

1. `resetAttemptState()`; `readPromptText()` (system prompt handling moves
   from the shell `printf` into the prompt/body — delete `opencodePromptCmd`).
2. Ensure server (step 2), `createOpencodeClient({baseUrl})`.
3. Resume self-heal (replaces today's blind `-s`): if
   `S.activeOpencodeSessionId`, probe `session.get`/`session.messages`; on
   miss, log `[sdk-retry]` and `session.create` fresh (Cursor precedent —
   one-time context reset is accepted; no CLI drain path).
4. `client.event.subscribe()` FIRST, then
   `session.prompt({path:{id}, body:{model:{providerID, modelID}, parts}})`.
   Split `normalizedOpencodeModel` ("openai/gpt-5.4") into
   providerID/modelID.
5. For each event for our session id: translate to the CLI JSONL shapes the
   existing parser already understands (`{type:"tool_use", state:{...}}`,
   `{type:"text"}`, `{type:"reasoning"}`, `{type:"step_finish"}`) and feed
   `processRealtimeStdoutChunk(JSON.stringify(line) + "\n")`. This keeps
   `opencodeParseLine`, `opencodeToolToStep`, `probeOpencodeStateResult` and
   their tests intact — the Codex trick. Only rewrite the parser (option B)
   if the SSE shapes turn out too far from the CLI shapes to translate
   cheaply; dump real `/event` traffic first and decide.
   - Tool parts arrive cumulatively via `message.part.updated`; emit
     `tool_use` once per status transition (pending→running→completed/error),
     keyed by part/tool id.
   - Text parts are cumulative too: track emitted length per part id and
     append only the delta.
6. Terminal: on `session.idle` (or prompt promise resolution — prefer whichever
   the SDK makes reliable), push a synthetic `{type:"result", is_error,
   result, duration_ms, usage:{input_tokens, output_tokens, ...}}` line with
   real token/cost data from the final assistant message / step-finish part,
   then DELETE `runtime/completion.ts:217-333` (the opencode reparse branch).
7. Health timer: inline `setInterval` like `cursorSdk` — max-runtime and
   no-output checks — and INCLUDE the in-flight-tool exemption
   (`if (S.inFlightToolUses > 0) lastMessageAt = now;`) added to
   `claudeSdk.ts`/`claudeSdkDaemon.ts` on 14 Aug (commit 29aa7976). While
   there, check whether `cursorSdk.ts` and `codexSdk.ts` health timers have
   the same exemption — they were written before the fix and likely kill
   long silent tools the same way. On timeout/cancel: `session.abort`, close
   the subscription, kill the server only if unresponsive.
8. Session persistence: on session create/first event, set
   `S.activeOpencodeSessionId` + `writeOpencodeSessionState()` +
   `syncOpencodeStateToPersist()` (same moments the parser does today).
9. Return `ProviderAttemptResult`; `finally` closes the event stream (server
   stays alive for reuse).

### 4. Wire-up and removal

- `attempts.ts` `runOpencodeAttempt` → delegate to `runOpencodeSdkAttempt`
  (mirror `runCursorAttempt`, including an availability guard on the auth env
  keys if useful).
- Delete `opencodePromptCmd`/`opencodeExecBaseCmd` from `config.ts` (keep
  `OPENCODE_BIN_PATH` — the server manager needs it).
- Keep `ensureOpencodeCliAvailable` in `launch.ts` (the CLI binary is still
  required, now for `serve`).
- `prepareOpencodeSessionState` keeps working unchanged (mode/resume decision);
  the self-heal lives in the runner.

### 5. Rebuild + docs

- Regenerate the bundle: `node packages/backend/scripts/build-callback-script.mjs`
  (typechecks first; NEVER hand-edit
  `convex/_sandbox_runtime/callbackScript.generated.ts`).
- Update `callback-src/TIMEOUTS.md` (CLI table row applies to nothing after
  this — cliAttempt has no callers), `packages/backend/docs/ARCHITECTURE.md:91,130`,
  `internal/changelog.md`. Move this plan to `internal/plans/implemented/`.
- Follow-up (separate task chip already exists): shrink `cliAttempt.ts` to
  `resetAttemptState`/`evaluateAttemptHealth` or move them to runtime/.

## Verification

- Unit: event-translation mapping (cumulative→delta text, tool status
  transitions, interleaved/parallel tools, reasoning, usage/cost, errors,
  cancellation). Existing fixtures keep passing if option A (translate to CLI
  shapes) is taken: `tests/toolResultCapture.test.ts:102`,
  `tests/canonical.test.ts:296`.
- Contract (mocked client): subscribe-before-prompt ordering, session-id
  filtering, abort on cancel, server-death restart, resume self-heal on
  missing session.
- Real sandbox (Vercel, Node 24): new conversation + follow-up turn (resume),
  file edit + shell command via tools, a silent >5-min tool (watchdog
  exemption), model + system-prompt preservation, sandbox stop/resume
  (server restart), cancellation, auth failure surface, old-snapshot fallback
  install. `npx tsc` via the bundle build; no dev/lint/build otherwise.
- Cross-check tokens/cost of one real run against the old CLI path's numbers
  before deleting the completion reparse.

## Assumptions and risks

- Reliability over latency; one-shot per turn is unchanged (no daemon).
- Version lockstep is the biggest operational risk (1.18.17 already broke
  snapshots once) — bump CLI+SDK together, test a fresh seed first.
- Hard cutover on resume: pre-migration CLI session ids that the server does
  not recognise self-heal to a fresh session (context reset for those chats),
  same trade Cursor shipped.
- t3code's runtime (github.com/pingdotgg/t3code, apps/server/src/provider/
  opencodeRuntime.ts) remains useful prior art for the server manager; its
  WebSocket/Effect/ACP machinery is not adopted.
