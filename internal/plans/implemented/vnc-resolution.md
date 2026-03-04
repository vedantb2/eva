# VNC Resolution + Quality Upgrade to 1920x1080

## Context

VNC desktop in sessions renders at 1024x768 (4:3) — looks wrong on modern 16:9 displays. noVNC quality=4 makes it blurry. Agent-browser screenshots in quick tasks also lack proper viewport sizing.

## Changes

### 1. Add `x11-utils` to snapshot image

**File:** `.github/workflows/rebuild-snapshot.yml`

- Add `x11-utils` to the `apt-get install` line (provides `xrandr` binary)
- Snapshot rebuild required before resolution change takes effect

### 2. Resize display after VNC start

**File:** `packages/backend/convex/daytona.ts` — `toggleDesktopServer` (line 1411)

- After `await sandbox.computerUse.start()`, run xrandr to resize framebuffer:

```
DISPLAY=:1 xrandr --fb 1920x1080
```

- Wrap in try/catch — non-fatal if xrandr fails (desktop still works at 1024x768)
- Fallback: try `xrandr --newmode` + `--addmode` + `--output` if `--fb` fails
- Uses existing `exec()` helper

### 3. Update Chrome launch flags

**File:** `packages/backend/convex/daytona.ts` — `launchChromeInDesktop` (line 1437)

- Add `--start-maximized --window-size=1920,1080` to Chrome command

### 4. Increase noVNC quality

**File:** `apps/web/app/(main)/[owner]/[repo]/sessions/[id]/DesktopPanel.tsx` (line 40)

- Change `quality` from `"4"` to `"6"`
- Keep `resize=scale` (correct mode for fixed server resolution)
- Keep `compression=2`

### 5. Add agent-browser viewport to quick task prompt

**File:** `packages/backend/convex/taskWorkflow.ts` (line 86-93)

- Add `agent-browser set viewport 1920 1080` step before screenshots in proof-of-completion section

### 6. Add agent-browser viewport to session prompt

**File:** `packages/backend/convex/sessionWorkflow.ts` (line 133)

- Add viewport instruction: `` `agent-browser set viewport 1920 1080` ``

### 7. Update docs

- `internal/docs/desktop-vnc.md` — update resolution, quality params, add xrandr note
- `internal/changelog.md` — new entry

## Verification

- Open a session, switch to Desktop tab → should render at 1920x1080 16:9
- Check noVNC image is sharper than before
- Run a quick task with proof-of-completion → screenshot should be 1920x1080
- If xrandr fails (pre-snapshot rebuild), desktop gracefully falls back to 1024x768
