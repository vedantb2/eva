# Add opencode CLI as third AI provider

## Context

Platform currently supports Claude Code + Codex CLI (baked in snapshot, auth via team env vars, per-model selector on sessions + quick tasks). Adding opencode (`opencode-ai` npm, `opencode` binary) gives users access to a broader model catalog (models.dev 75+ providers) under one CLI, same integration shape as claude/codex. Auth via single team env var `OPENCODE_CONFIG_JSON` (inline JSON config, provider keys via `{env:...}` substitution). v1 ships with full session resume parity.

## 1. Snapshot — `.github/workflows/rebuild-snapshot.yml:34`

Append `opencode-ai` to the global npm install line:

```
RUN npm install -g @anthropic-ai/claude-code @openai/codex opencode-ai agent-browser convex
```

## 2. `packages/backend/convex/validators.ts`

- `aiProviderValidator` (line 154): add `v.literal("opencode")`.
- `AIProvider` type (line 174): `"claude" | "codex" | "opencode"`.
- `aiModelValidator` (line 159): add `v.literal("opencode:openai/gpt-5-codex")`.
- `AIModel` type (line 176): add `"opencode:openai/gpt-5-codex"`.
- `AI_MODEL_OPTIONS` (line 202): append `{ id: "opencode:openai/gpt-5-codex", provider: "opencode", label: "Opencode GPT-5 Codex", requiresAuth: true }`.
- Add `OPENCODE_MODELS` export (symmetric with `CODEX_MODELS`).
- Add `OPENCODE_AUTH_ENV_KEYS = ["OPENCODE_CONFIG_JSON", "OPENCODE_CONFIG_JSON_BASE64"] as const` alongside `CODEX_AUTH_ENV_KEYS` (line 265).
- `AIProviderAvailability` interface: add `opencode: boolean`.
- `getAIProviderAvailability()` (line 275): `opencode: OPENCODE_AUTH_ENV_KEYS.some(k => keys.has(k))`.
- `normalizeAIModel()` (line 286): add case `"opencode:openai/gpt-5-codex"` returning same.
- `getAIModelProvider()` (line 316): prefix check `"opencode:"` → `"opencode"`.
- `findAIModelOption()` (line 323): auto-works once `AI_MODEL_OPTIONS` extended.

## 3. `packages/backend/convex/_daytona/volumes.ts`

- Add constant `OPENCODE_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.opencode-persist"`.
- `PersistedProvider` (line 29): `"claude" | "codex" | "opencode"`.
- `ensureSessionPersistenceVolumes()` (line 144): append third mount with `subpath: sessionVolumeSubpath("opencode", sessionKind, sessionId)`.

## 4. `packages/backend/convex/_daytona/launch.ts`

- Add `OPENCODE_FALLBACK_INSTALL_DIR` + `OPENCODE_FALLBACK_BIN_PATH` constants (mirror Codex at line 17).
- Add `ensureOpencodeCliAvailable(sandbox)` parallel to `ensureCodexCliAvailable` (line 23): `npm install -g --prefix ... opencode-ai` if `command -v opencode` fails.
- In `launchScript()` (line 55): if provider `"opencode"`, call the new ensure helper.
- `envParts` (line 101): add `OPENCODE_RUNTIME_HOME_DIR`, `OPENCODE_PERSIST_DIR`, `OPENCODE_BIN_PATH` (parallel to Codex lines 112–114). These are always set; auth env vars (`OPENCODE_CONFIG_JSON` / `_BASE64`) flow via sandbox env already (team env var pass-through), same as Codex today.

## 5. `packages/backend/convex/_daytona/callbackScript.ts`

### Verified event shape (captured from live `opencode run --format json` 1.3.13)

Every JSON line has envelope:

```
{ "type": <string>, "timestamp": <ms>, "sessionID": "ses_...", "part": {...} | "error": {...} }
```

Observed `type` values and meanings:

- `step_start` — assistant step begins. `part.type: "step-start"`, `part.messageID`, `part.sessionID`, `part.snapshot`.
- `text` — whole assistant text chunk (not token-by-token deltas). `part.type: "text"`, `part.text: string`, `part.messageID`, `part.time.{start,end}`.
- `tool_use` — single event per tool invocation (non-streaming). `part.type: "tool"`, `part.tool: "bash"|"read"|"edit"|...`, `part.callID`, `part.state.status: "completed"|"error"|"running"`, `part.state.input`, `part.state.output?`, `part.state.error?`, `part.state.time.{start,end}`, `part.title?`.
- `step_finish` — step ends. `part.reason: "stop"|"tool-calls"|...`, `part.tokens.{total,input,output,reasoning,cache.{write,read}}`, `part.cost`. **Final `step_finish` with `reason:"stop"` is the terminal event.**
- `error` — top-level `error.name`, `error.data.message`. No `part` on these.

### Changes

- Env reads (lines 62–65): add `OPENCODE_CONFIG_JSON`, `OPENCODE_CONFIG_JSON_BASE64`; plus runtime paths mirroring Codex (lines 54–56).
- Constants: `OPENCODE_STATE_FILE = "session-state.json"`, local + persist state file paths.
- Add `hydratePersistedOpencodeState()` (mirror `hydratePersistedCodexState` line 864): `mkdirSync` runtime dir; copy persisted `session-state.json` into runtime; decode `OPENCODE_CONFIG_JSON{,_BASE64}` and export as `process.env.OPENCODE_CONFIG_CONTENT` before spawn; also set `process.env.OPENCODE_PERMISSION = '"allow"'` and `OPENCODE_DISABLE_AUTOUPDATE = "1"`.
- Add `syncOpencodeStateToPersist()` and `writeOpencodeSessionState()` (mirror Codex equivalents at lines 850, 886). Persist just `{ resumeSessionId, updatedAt }`.
- Command construction (lines 1388–1409): add
  ```
  const opencodeCommand = existsSync(OPENCODE_BIN_PATH) ? JSON.stringify(OPENCODE_BIN_PATH) : "opencode";
  const normalizedOpencodeModel = MODEL.startsWith("opencode:") ? MODEL.slice("opencode:".length) : MODEL;
  const opencodeBaseCmd = opencodeCommand + " run --format json --model " + JSON.stringify(normalizedOpencodeModel);
  ```
  Append `-s ` + JSON.stringify(activeOpencodeSessionId) when a persisted session id exists; else start fresh. Prompt piped via stdin (opencode accepts positional message OR stdin — same pattern as Codex).
- Dispatch: extend provider branch where `codex`/`claude` commands are selected to include `opencode`.
- `handleRealtimeStreamLine()` (line 1481): add `PROVIDER === "opencode"` branch:
  - On first event seen: `activeOpencodeSessionId = parsed.sessionID` → write state → heartbeat.
  - `type === "step_start"`: emit "Thinking..." step transition (mirrors Claude first-assistant-event).
  - `type === "text"`: append `parsed.part.text` to streamed content buffer.
  - `type === "tool_use"`: map `parsed.part.tool` → tool step type (`bash`→`bash`, `read`→`read`, `edit`→`edit`, `webfetch`→`web_fetch`, etc.); status comes from `parsed.part.state.status`.
  - `type === "step_finish"` with `part.reason === "stop"`: set `resultEventSeen = true`, call `syncOpencodeStateToPersist()`.
  - `type === "error"`: set error flag; `parsed.error.data.message` is the message.
- `extractResultEvent()` (line 1433): add opencode branch — walk lines, find the last `step_finish` with `part.reason === "stop"` and capture its `part.messageID`; concatenate `part.text` from all `text` events whose `part.messageID` matches; return `{ result, isError: false, rawResultEvent: lastStepFinishLine }`. If no terminal `stop` event but an `error` event was seen, return `{ result: errorMessage, isError: true, rawResultEvent: errorLine }`.
- Startup step labels at line 1017 and similar: add `"Preparing Opencode session..."` branch.

## 6. UI

No structural change — selectors already drive from `AI_MODEL_OPTIONS` + availability.

- `apps/web/src/routes/_global/teams/_components/TeamEnvVarsTab.tsx:35`: extend description to `"...Add CODEX_AUTH_JSON or OPENCODE_CONFIG_JSON here to enable Codex / Opencode across the team."`.
- `apps/web/src/lib/components/SetupBanner.tsx`, `apps/web/src/routes/_repo/$owner/$repo/sessions/ChatPanel.tsx`, `apps/web/src/lib/components/quick-tasks/_components/TaskCardMenuItems.tsx`, `apps/web/src/lib/components/projects/ProjectChatArea.tsx`: grep for any hardcoded `"claude" | "codex"` copy / icons — add opencode equivalents.

## 7. Auth model

Single team env var: **`OPENCODE_CONFIG_JSON`** (raw) or **`OPENCODE_CONFIG_JSON_BASE64`** (base64). Holds an inline opencode config, e.g.:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openai": { "options": { "apiKey": "{env:OPENAI_API_KEY}" } }
  }
}
```

Team still sets `OPENAI_API_KEY` (etc.) separately so the substitution resolves. Callback decodes the JSON and exports it as `OPENCODE_CONFIG_CONTENT` at spawn time — no file writes, no `opencode auth login`. `OPENCODE_PERMISSION='"allow"'` and `OPENCODE_DISABLE_AUTOUPDATE=1` always set by callback.

## 8. Persistence & resume

Shared-repo volume gets a third subpath `opencode-sessions/<kind>/<hash>` mounted at `/home/eva/.opencode-persist`. Callback hydrates `session-state.json` → reads last session id → `opencode run -s <id>` for resume. Terminal event → write updated state back to persist dir. Symmetric with existing Codex behavior.

## Critical files to modify

- `.github/workflows/rebuild-snapshot.yml`
- `packages/backend/convex/validators.ts`
- `packages/backend/convex/_daytona/volumes.ts`
- `packages/backend/convex/_daytona/launch.ts`
- `packages/backend/convex/_daytona/callbackScript.ts`
- `apps/web/src/routes/_global/teams/_components/TeamEnvVarsTab.tsx` (copy only)

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable` — validator additions typecheck.
2. Rebuild snapshot via workflow dispatch; confirm `opencode --version` works in a spawned sandbox.
3. Team env vars: add `OPENCODE_CONFIG_JSON` + provider key; verify `getAIProviderAvailability` flips `opencode: true` and Opencode models appear in model picker.
4. Trigger a quick task with `opencode:openai/gpt-5-codex`; check Convex logs for `AI_PROVIDER=opencode`, sandbox log shows `opencode run --format json --model openai/gpt-5-codex`, streaming heartbeats arrive, terminal event persisted, final assistant text surfaces in task result.
5. Run a second task referencing same session — confirm `-s <id>` resume flag applied and prior context retained.
6. Unit-confirm `normalizeAIModel` / `getAIModelProvider` / `findAIModelOption` return expected values for `"opencode:openai/gpt-5-codex"` and unknown-prefix inputs.

## Notes from live probe (opencode 1.3.13 on Windows, OpenAI ChatGPT oauth)

- `opencode run -h` confirms `-s <sessionId>` and `-c` flags exist; `--format json` emits one JSON object per line; `-m provider/model` is the model flag.
- `openai/gpt-5` is **not** a valid model id — suggestions are `gpt-5.2`, `gpt-5.4`, `gpt-5-codex`. Our validator literal `opencode:openai/gpt-5-codex` aligns with the actual catalog.
- `gpt-5-codex` requires an OpenAI API key (not a ChatGPT account oauth) — document this in the team env-var setup hint so users seeing 400s know to provide an API key via the config's `{env:OPENAI_API_KEY}` substitution.
- Default permission posture rejects shell commands even in non-interactive mode (observed "auto-rejecting" for `bash`); `OPENCODE_PERMISSION='"allow"'` is required for useful tool use in the sandbox — confirmed effective.
- Opencode's persist directory is `~/.local/share/opencode/` (seen via `opencode auth list`), but we drive everything via `OPENCODE_CONFIG_CONTENT` env + self-managed `session-state.json`, so the mount path is just ours, not opencode's internal.
