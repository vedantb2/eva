# Plan Review: Cursor CLI Provider

## Summary

Verified the existing plan at `c:\Users\vedan\.cursor\plans\cursor_cli_provider_48ddb43d.plan.md` against official Cursor docs and codebase. **Plan is sound with minor clarifications.**

---

## Web Verification Results

### Confirmed from Official Docs

| Claim                                                              | Source                                                                 | Status  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------- |
| `CURSOR_API_KEY` env var                                           | [authentication](https://cursor.com/docs/cli/reference/authentication) | Correct |
| Binary name `agent`, install via `curl https://cursor.com/install` | [installation](https://cursor.com/docs/cli/installation)               | Correct |
| `-p` / `--print` for non-interactive                               | [using](https://cursor.com/docs/cli/using)                             | Correct |
| `--output-format stream-json` NDJSON                               | [output-format](https://cursor.com/docs/cli/reference/output-format)   | Correct |
| `--resume [chatId]` / `--continue`                                 | [parameters](https://cursor.com/docs/cli/reference/parameters)         | Correct |
| `--force`, `--trust`, `--approve-mcps`                             | [parameters](https://cursor.com/docs/cli/reference/parameters)         | Correct |
| `.cursor/mcp.json` with `mcpServers.{name}.url` + `headers`        | [MCP](https://cursor.com/docs/mcp)                                     | Correct |

### Stream-JSON Event Structure (from docs)

```jsonc
// Init
{"type":"system","subtype":"init","session_id":"<uuid>","model":"...","apiKeySource":"env|flag|login"}

// Assistant (one line per complete message, unless --stream-partial-output)
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"..."}]},"session_id":"<uuid>"}

// Tool calls
{"type":"tool_call","subtype":"started","call_id":"...","tool_call":{...},"session_id":"<uuid>"}
{"type":"tool_call","subtype":"completed","call_id":"...","tool_call":{...},"session_id":"<uuid>"}

// Terminal
{"type":"result","subtype":"success","is_error":false,"result":"...","duration_ms":1234,"session_id":"<uuid>"}
```

**Key difference from Claude**: Cursor uses separate `tool_call` lines with `started`/`completed` subtypes. Claude embeds `tool_use` blocks inside `assistant` content.

### Resume ID Clarification

Docs use "thread" and "chatId" interchangeably. Stream events emit `session_id`. **All three refer to the same UUID** — persist `session_id` from `system.init`, pass to `--resume`.

---

## Suggested Initial Model Slugs

From [Models & Pricing](https://cursor.com/docs/models-and-pricing) and forum posts, reasonable initial set:

```typescript
// In validators.ts
export const CURSOR_MODELS: ReadonlyArray<AIModel> = [
  "cursor:claude-4-sonnet", // Claude 4 Sonnet (default)
  "cursor:claude-4.6-sonnet", // Claude 4.6 Sonnet
  "cursor:claude-4.5-opus", // Claude 4.5 Opus
  "cursor:gpt-5.4", // GPT-5.4
  "cursor:gpt-5.4-mini", // GPT-5.4 Mini
  "cursor:gemini-3-pro", // Gemini 3 Pro
] as const;
```

**Note**: Exact slugs may differ (e.g., `sonnet-4` vs `claude-4-sonnet`). Run `agent --list-models` on a real install to confirm. Start with 4-6 models, expand later.

---

## Codebase Alignment

### validators.ts Pattern (confirmed)

- `AIProvider`: union of `"claude" | "codex"` → add `"cursor"`
- `AIModel`: prefixed slugs like `"codex:gpt-5.4"` → use `"cursor:..."` format
- `getAIProviderAvailability`: checks env var presence → add `CURSOR_API_KEY`
- `getAIModelProvider`: prefix check → add `cursor:` branch

### volumes.ts Pattern (confirmed)

- `PersistedProvider`: `"claude" | "codex"` → add `"cursor"`
- `sessionVolumeSubpath`: returns `${provider}-sessions/...` → works as-is
- `ensureSessionPersistenceVolumes`: returns 2 mounts → add third for Cursor
- Add constants: `CURSOR_RUNTIME_HOME_DIR = "/tmp/cursor-home"`, `CURSOR_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.cursor-persist"`

### callbackScript.ts Pattern (confirmed)

- Provider branching: `if (PROVIDER === "codex") { ... } else { ... }`
- For Cursor: add `else if (PROVIDER === "cursor") { ... }`
- Stream parsing: map `tool_call.started` → step started, `tool_call.completed` → step completed
- Session state: persist `session_id` from init event, pass to `--resume`
- MCP: write to `WORK_DIR/.cursor/mcp.json`, add `--approve-mcps --trust`

---

## Plan Adjustments Needed

1. **Add `--stream-partial-output`** — For UI responsiveness during long tool calls, recommend enabling this flag so text streams character-by-character instead of waiting for complete assistant messages.

2. **Result event has `subtype`** — Plan should note `subtype: "success"` in result parsing (not just `is_error`).

3. **`session_id` = resume ID** — Clarify in plan that the `session_id` from `system.init` is what gets passed to `--resume`. No separate "thread id" field.

4. **Hardcode initial models** — User approved. Start with ~6 models covering Claude/GPT/Gemini. Verify slugs with `agent --list-models` before merge.

5. **MCP path is workspace-relative** — Plan says `WORK_DIR/.cursor/mcp.json`. Confirm this is created inside the git repo (not `/tmp`). Add `mkdir -p` before write.

---

## Risks (unchanged from original plan)

- Model slugs need verification via `agent --list-models`
- `agent` process name is generic — kill by PID, not `pkill agent`
- MCP adapter: strip Claude-only fields (`type`, etc.)
- PATH must include `~/.local/bin` after install

---

## Verdict

**Plan is ready for implementation** with the adjustments above. No architectural changes needed.

### Sources

- [Output format | Cursor Docs](https://cursor.com/docs/cli/reference/output-format)
- [Parameters | Cursor Docs](https://cursor.com/docs/cli/reference/parameters)
- [Using Agent in CLI | Cursor Docs](https://cursor.com/docs/cli/using)
- [MCP | Cursor Docs](https://cursor.com/docs/mcp)
- [Models & Pricing | Cursor Docs](https://cursor.com/docs/models-and-pricing)
- [CLI Update Jan 2026](https://cursor.com/changelog/cli-jan-08-2026)
