# CDP Mode: Agent-Browser → VNC Chrome Integration (Sessions Only)

## Context

Two separate browsers exist in sandboxes: agent-browser's headless Playwright Chromium and the VNC Chrome visible in the Desktop tab. By enabling CDP (Chrome DevTools Protocol), agent-browser connects to the VNC Chrome, letting users watch agent actions live in sessions.

Scoped to **sessions only** — tasks are one-shot (agent takes proof screenshot, sandbox cleaned up, nobody watching live).

## Changes

### 1. Create `startDesktopWithChrome` helper

**File:** `packages/backend/convex/daytona.ts`

Extract desktop+Chrome startup into a reusable function:

```
async function startDesktopWithChrome(sandbox: Sandbox): Promise<void>
```

Steps:

1. `sandbox.computerUse.start()` — start VNC stack
2. `xrandr --fb 1920x1080` — resize framebuffer (with existing fallback chain)
3. Launch Chrome with `--remote-debugging-port=9222` (only if not already running: `pgrep -f google-chrome || ...`)

All steps non-fatal (wrapped in try/catch).

### 2. Add `--remote-debugging-port=9222` to Chrome launch

**File:** `packages/backend/convex/daytona.ts` — `launchChromeInDesktop` action (~line 1452)

Add the flag + `pgrep` guard for idempotency (prevents duplicate Chrome when backend already launched it):

```bash
pgrep -f google-chrome > /dev/null 2>&1 || DISPLAY=:1 nohup google-chrome-stable --no-sandbox --disable-dev-shm-usage --start-maximized --window-size=1920,1080 --remote-debugging-port=9222 > /dev/null 2>&1 &
```

### 3. Add `startDesktop` flag to `setupAndExecute`

**File:** `packages/backend/convex/daytona.ts` — `setupAndExecute` (~line 1031)

Add arg: `startDesktop: v.optional(v.boolean())`

When `true`, call `startDesktopWithChrome(sandbox)` after sandbox creation/branch setup but before `launchScript`.

### 4. Pass `startDesktop: true` from session workflow only

**File:** `packages/backend/convex/sessionWorkflow.ts` (~line 168) — add `startDesktop: true` to `setupAndExecute` call

Task workflows, doc workflows — no change.

### 5. Update session prompt for CDP detection

**File:** `packages/backend/convex/sessionWorkflow.ts` — browser interaction rule (~line 133)

Replace current agent-browser instruction with CDP-aware version:

```
Before using agent-browser, check if Chrome CDP is available:
  curl -sf http://localhost:9222/json/version > /dev/null && echo "CDP" || echo "NO_CDP"
- If CDP: use `agent-browser --cdp 9222` for all commands. Skip `set viewport` (VNC Chrome is already 1920x1080).
- If NO_CDP: use `agent-browser set viewport 1920 1080` first, then agent-browser normally.
Always use `--annotate` for screenshots.
```

Task workflow prompt (`taskWorkflow.ts`) — no CDP change (keep current `--annotate` instructions).

### 6. Frontend: No changes needed

DesktopPanel already checks if VNC is ready before calling `toggleDesktopServer`. Since the backend auto-starts the desktop for sessions, DesktopPanel finds VNC already running → skips startup → immediately renders iframe. The `pgrep` guard in `launchChromeInDesktop` prevents duplicate Chrome.

## Files Modified

1. `packages/backend/convex/daytona.ts` — helper function, Chrome flags, `setupAndExecute` arg, `launchChromeInDesktop` idempotency
2. `packages/backend/convex/sessionWorkflow.ts` — `startDesktop: true` arg + CDP-aware prompt

## Edge Cases

- **Desktop already running (session reuse):** `computerUse.start()` is idempotent. `pgrep` guard prevents duplicate Chrome.
- **Chrome crashes mid-session:** Agent falls back to headless browser (CDP check fails → `NO_CDP` path).
- **xrandr fails:** Non-fatal, desktop works at default 1024x768. Chrome still gets CDP flag.
- **Multiple messages in same session:** Desktop started once, subsequent `setupAndExecute` calls with existing sandbox — `computerUse.start()` is idempotent, Chrome `pgrep` guard skips duplicate launch.

## Verification

1. Start a session → send a message → before clicking Desktop tab, verify `curl -s http://localhost:9222/json/version` works in sandbox terminal
2. Click Desktop tab → VNC should connect immediately (already running)
3. Send a message asking agent to use browser → see actions in Desktop tab live via `--cdp 9222`
4. Send a message with Desktop tab closed → agent falls back to headless (screenshots still work)
5. Send multiple messages → verify no duplicate Chrome instances (`pgrep -c google-chrome` returns 1)
