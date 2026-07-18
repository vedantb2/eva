# Agent-Driven Browser Tab in Sessions (Cursor Browser parity)

## Context

Goal: agent controls a browser the user watches live in the session page, Cursor-Browser style (agent navigates/clicks/types; user sits back, can take over). Cursor does this with an embedded Chromium webview + `cursor-ide-browser` MCP (`browser_navigate/lock/snapshot/click/type/fill/take_screenshot/unlock`).

**Key finding: ~80% already exists in eva, and this exact feature was designed once before** (`internal/plans/implemented/cdp-agent-vnc.md`) then partially disabled during boot-speed work:

| Piece                     | Status                                                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Watchable browser surface | ✅ "Computer" tab = noVNC iframe (port 6080) showing Chrome maximized on bare X display, fully interactive ([DesktopPanel.tsx](apps/web/src/routes/_repo/$owner/$repo/sessions/DesktopPanel.tsx)) |
| Chrome with CDP           | ✅ launched with `--remote-debugging-port=9222` ([desktop.ts](packages/backend/convex/_daytona/desktop.ts)), both providers (Daytona Xvfb :0 / Vercel Xvnc :1)                                    |
| Agent browser CLI         | ✅ `agent-browser` baked into image, `connect 9222`/`--cdp` attaches to that same Chrome (daemon persists connection); skill in `.agents/skills/agent-browser`                                    |
| Screenshot→chat           | ✅ `screenshots:upload` → message `imageStorageId` → `ScreenshotPreview` in chat                                                                                                                  |
| Sandbox→eva channel       | ✅ hosted eva MCP (`/tmp/eva-mcp.json`, bearer token minted in `signAndLaunchScript`)                                                                                                             |
| Gaps                      | ❌ desktop off at session boot (`startDesktop: false`); ❌ no browser rule in session prompt (agent-browser runs own headless chromium, invisible); ❌ no lock/auto-switch UX                     |

User decisions: new first-class **Browser** tab (keep Preview + Computer in `+`) · one shared noVNC/Chrome surface · desktop on-demand via agent MCP tool · CLI-first + 3 eva MCP tools · auto-switch to Browser + takeover overlay. Sessions only (tasks/automations unchanged). No snapshot image rebuild needed.

## Design

One shared Chrome (the desktop one, CDP 9222). Agent drives it via `agent-browser connect 9222`; user watches/interacts via existing noVNC tab. Soft lock = `agentBrowsingAt` timestamp on the session doc, set/cleared by MCP tools, drives auto-switch + overlay reactively. Lock is UX-only (both can technically act; VNC input stays live under the scrim).

```
agent ──bash──> agent-browser daemon ──CDP──> Chrome (:9222, DISPLAY :0/:1)
agent ──MCP──> eva backend: browser_start / browser_lock / browser_unlock
                    │ startDesktopWithChrome        │ sessions.agentBrowsingAt
user  <──noVNC iframe (port 6080, __eva_grant)──────┴──> reactive UI (auto-switch, overlay)
```

## Implementation

### 1. Schema: session lock field

- `packages/backend/convex/_validators/tableFields.ts` — add `agentBrowsingAt: v.optional(v.number())` to session fields (single-source-of-truth const; schema + return validators pick it up).

### 2. MCP token carries session identity

- `packages/backend/convex/sandboxJwt.ts` `mintSandboxSessionTokens` — add optional `entityId`/`entityKind` args, embed as claims. Caller `signAndLaunchScript` ([\_daytona/helpers.ts:530](packages/backend/convex/_daytona/helpers.ts)) already has `entityId`; pass it. MCP auth layer exposes claims to nodeActions.

### 3. Three MCP tools (pattern: `mcp/tools.ts` def → `mcp/nodeActions.ts` action)

- `browser_start`: resolve session from token claim → `sandboxId` → new `internal` action in `_daytona/services.ts` wrapping existing `startDesktopWithChrome` (idempotent; `launchChrome` already polls CDP ready). Returns: "Chrome ready. Run `agent-browser connect 9222`. User watches in Browser tab. App: http://localhost:3000".
- `browser_lock`: patch `agentBrowsingAt = Date.now()` on session.
- `browser_unlock`: clear it.
- Session-kind tokens only; do NOT add to `READ_ONLY_TOOLS` in `artifacts.ts`.

### 4. Session prompt browser rule (edit mode only)

- `packages/backend/convex/_sessions/prompts.ts` `buildEditPrompt` — add (adapted from prior `cdp-agent-vnc.md` design):
  - For browser verification/browsing: call eva MCP `browser_start`, then `agent-browser connect 9222` once; all agent-browser commands then drive the shared visible browser.
  - Call `browser_lock` before interacting, `browser_unlock` when done.
  - If `browser_start` fails/unavailable → plain headless agent-browser (current behavior).
  - Skip `set viewport` in CDP mode (already 1920×1080).
- `_taskWorkflow`/`_automationWorkflow` prompts unchanged.

### 5. Clear stale lock on run end

- `sessionWorkflow.saveResult` (root `packages/backend/convex/sessionWorkflow.ts`) — clear `agentBrowsingAt` when a run completes (crash hygiene).

### 6. Frontend

- [SandboxTabBar.tsx](apps/web/src/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar.tsx) — new first-class `browser` tab next to Preview (`IconBrowser` + pulse while locked). Computer stays in `+` as `desktop`.
- `SessionDetailClient.tsx` — on `agentBrowsingAt` undefined→set: navigate to `browser` + expand right panel (`expandRightSignal`). Transition-only.
- [DesktopPanel.tsx](apps/web/src/routes/_repo/$owner/$repo/sessions/DesktopPanel.tsx) — shared by Browser + Computer; when locked: scrim + "Agent is browsing — click to take control" → `sessions.releaseBrowserLock`. Lock older than 30 min treated expired client-side.
- New mutation `releaseBrowserLock` in root `sessions.ts`.

### Explicitly not doing (and why)

- `chrome-devtools-mcp` / `agent-browser mcp` full toolset — redundant with CLI every agent CLI (Claude/Codex/Cursor/Opencode) can run via Bash.
- agent-browser WS frame-streaming tab — future option if VNC feels heavy; agent-side contract (CLI) wouldn't change.
- Driving the user's Preview iframe — only works while their tab is open; no reliable screenshots; not Cursor parity.

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable`; `cd apps/web && npx tsc --noEmit`.
2. Deploy backend to dev (`good-mule-506` — never prod from a WIP branch).
3. Start a session → message: "open the app in the browser and check the dashboard renders" → expect: agent calls `browser_start`, right panel auto-switches to Browser tab, live Chrome actions visible, overlay shown.
4. Click overlay → take control works (lock cleared, VNC input).
5. In sandbox terminal: `curl -s localhost:9222/json/version` ok; `pgrep -c chrome` shows one instance across multiple messages.
6. Agent screenshot still lands in chat (existing pipeline).
7. Desktop-tab manual open (no agent) still works as today.

## Final step

Run `/ship` skill.

## Unresolved questions

- None blocking. Optional later: per-repo origin allowlist for agent browsing (Cursor offers this; sandbox isolation makes it non-urgent).
