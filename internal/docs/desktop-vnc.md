# Desktop VNC Tab

## Overview

The Desktop tab provides a graphical XFCE desktop environment inside Daytona sandboxes via noVNC. Users can interact with GUI apps (including Chrome) through an iframe embedded in the session panel.

## Architecture

```
Browser (noVNC iframe)
    ↓ WebSocket (signed preview URL on port 6080)
Daytona Proxy
    ↓
noVNC (web-based VNC client)
    ↓
x11vnc (VNC server)
    ↓
Xvfb (virtual framebuffer, resized to 1920x1080 via xrandr)
    ↓
xfce4 (desktop environment) + Chrome + GUI apps
```

Daytona's SDK manages the entire VNC stack via `sandbox.computerUse.start()` / `stop()`. We cannot swap individual components (e.g., replacing x11vnc with TigerVNC) — that's controlled by Daytona.

## Implementation

### Backend (`packages/backend/convex/daytona.ts`)

`toggleDesktopServer` action — calls `sandbox.computerUse.start()` or `stop()`. After start, runs `xrandr --fb 1920x1080` to resize the virtual framebuffer from the default 1024x768. Falls back to `xrandr --newmode` + `--addmode` + `--output` if `--fb` fails. Non-fatal — desktop still works at 1024x768 if xrandr is unavailable (requires `x11-utils` in snapshot).

### Frontend (`apps/web/app/(main)/[repo]/sessions/[id]/DesktopPanel.tsx`)

Follows the `EditorPanel.tsx` pattern exactly:

- State machine: `idle → starting → running → error`
- On mount (when sandbox active), checks if port 6080 is already responding
- If not, calls `toggleDesktopServer` to start VNC, then polls `getPreviewUrl` on port 6080
- Max 40 poll attempts (2 min timeout) — VNC startup is slower than code-server
- sessionStorage cache (`conductor:desktop:{sessionId}`) for instant restore on tab switch
- Toolbar: fullscreen button + open-in-new-tab button
- `appendNoVncParams()` helper safely appends query params to signed URLs (which already contain `?token=...`)

### noVNC Query Params

```
autoconnect=true    — auto-connect on load (skip "Connect" button)
resize=scale        — scale desktop to fit iframe
quality=6           — JPEG quality (0-9, higher = sharper)
compression=2       — zlib compression (0-9, lower = less CPU overhead)
```

Quality=6 provides sharp text/UI at 1920x1080. Compression stays at 2 to avoid CPU overhead on encoding.

### Search Params (`apps/web/lib/search-params.ts`)

`sandboxTabs` includes `"desktop"` — tab state persists in URL via nuqs.

### SandboxPanel Wiring (`SandboxPanel.tsx`)

- `IconDeviceDesktop` tab trigger
- Conditionally rendered `<DesktopPanel>` div (hidden when other tabs active)

## Snapshot Image Requirements

Since we use a custom image (not Daytona's default), VNC packages must be explicitly installed. Added to `rebuild-snapshot.yml`:

### VNC & Desktop Packages

`xvfb`, `xfce4`, `xfce4-terminal`, `x11vnc`, `novnc`, `dbus-x11`, `x11-utils` (provides `xrandr`)

### X11 Libraries

`libx11-6`, `libxrandr2`, `libxext6`, `libxrender1`, `libxfixes3`, `libxss1`, `libxtst6`, `libxi6`

### Chrome

Downloaded via Google's apt repo and installed as `google-chrome-stable`.

## Resource Limits

Daytona sandbox limits (max for standard tier):

| Resource | Default | Our Config | Daytona Max |
| -------- | ------- | ---------- | ----------- |
| CPU      | 1 vCPU  | 4 vCPU     | 4 vCPU      |
| Memory   | 1 GB    | 8 GB       | 8 GB        |
| Disk     | 3 GiB   | 10 GB      | 10 GB       |

We run at max on all three. Typical memory usage with all services running:

- Chrome: ~500MB (multiple processes)
- code-server + TS server: ~900MB
- Next.js dev server: ~400MB
- VNC stack (Xvfb + xfce4 + x11vnc): ~170MB
- Total: ~2-3GB steady state, spikes higher during compilation

With 2 vCPUs the load average was 7+ (heavily overloaded). 4 vCPUs allows x11vnc frame encoding to run on separate cores from Chrome and Next.js.

Contact `support@daytona.io` for limits beyond 4/8/10.

## Constraints & Known Issues

1. **VNC latency is inherent** — frames go through Xvfb → x11vnc encoding → WebSocket → noVNC JS canvas. It will never feel native.
2. **Cannot swap VNC components** — Daytona's `computerUse.start()` manages the full stack. TigerVNC (faster encoder) would require Daytona-side changes.
3. **No root access via SSH or SDK** — sandbox user is `eva` (uid 1001), no sudo. The Daytona SDK's `exec` also runs as `eva`. Package installation must happen at image build time.
4. **No outbound internet from sandbox** — `curl`/`wget` to external URLs hang. Downloads must happen during Docker image build (in GitHub Actions), not at runtime.
5. **Chrome looks unstyled** — XFCE4 ships with minimal GTK themes. Adding `adwaita-icon-theme` and font packages (`fonts-noto`, `fonts-liberation`) to the Dockerfile would improve appearance.
6. **Signed URLs expire in 24 hours** — `getSignedPreviewUrl(port, 86400)`. The sessionStorage cache is cleared when sandbox goes inactive.

## Future Improvements

- **TigerVNC** — if Daytona adds support, would significantly improve encoding speed
- **WebRTC streaming** — H.264 encoded, hardware accelerated, 60fps possible. Massive undertaking, not compatible with current Daytona setup
- **Theme packages** — add GTK themes and fonts to snapshot for better Chrome appearance
