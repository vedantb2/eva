"use node";

import type { SandboxHandle } from "../_sandbox/provider";
import { execHandle } from "./helpers";

// Chrome launch:
// - If a Chrome instance is already running with our remote-debugging port,
//   it's ours — skip relaunching so the user doesn't lose tabs on sandbox resume.
// - Otherwise (e.g. xfce4-panel auto-started a flagless Chrome), kill any
//   existing chrome processes and relaunch with our full flag set.
// - Display selection is runtime-detected because Daytona uses Xvfb on :0,
//   while Vercel uses TigerVNC's Xvnc on :1.
// - --disable-dev-shm-usage: /dev/shm is only 64MB in this container; Chrome
//   would otherwise hit shm-full crashes with multiple tabs.
// - --user-data-dir=...: required for --remote-debugging-port to actually
//   bind. Chrome refuses DevTools Protocol on the default profile for
//   security reasons.
// - The --disable-background-* / --disable-features=… flags prevent Chrome
//   from throttling, freezing, or discarding hidden tabs — needed for
//   multi-tab dev where each tab keeps live websocket/long-poll connections
//   (Convex live queries, Supabase realtime, etc.).
const CHROME_LAUNCH_CMD =
  "if curl -fsS http://127.0.0.1:9222/json/version >/dev/null 2>&1; then exit 0; fi; " +
  "BROWSER=$(command -v google-chrome-stable || command -v chromium-browser || command -v chromium || true); " +
  'if [ -z "$BROWSER" ]; then exit 0; fi; ' +
  "pkill -x chrome 2>/dev/null || true; " +
  "pkill -x chromium 2>/dev/null || true; " +
  "pkill -x chromium-browser 2>/dev/null || true; " +
  "pkill -x google-chrome 2>/dev/null || true; " +
  "pkill -x google-chrome-stable 2>/dev/null || true; " +
  "sleep 1; " +
  "mkdir -p /home/eva/.config/chrome-debug && " +
  'DISPLAY_VALUE="${EVA_DESKTOP_DISPLAY:-}"; ' +
  'if [ -z "$DISPLAY_VALUE" ]; then DISPLAY=:1 xprop -root >/dev/null 2>&1 && DISPLAY_VALUE=:1; fi; ' +
  'if [ -z "$DISPLAY_VALUE" ]; then DISPLAY=:0 xprop -root >/dev/null 2>&1 && DISPLAY_VALUE=:0; fi; ' +
  'if [ -z "$DISPLAY_VALUE" ]; then DISPLAY_VALUE=:0; fi; ' +
  'DISPLAY="$DISPLAY_VALUE" nohup "$BROWSER" ' +
  "--no-sandbox --disable-dev-shm-usage --start-maximized --window-size=1920,1080 " +
  "--user-data-dir=/home/eva/.config/chrome-debug " +
  "--remote-debugging-port=9222 --no-first-run --no-default-browser-check --disable-sync " +
  "--disable-background-timer-throttling " +
  "--disable-backgrounding-occluded-windows " +
  "--disable-renderer-backgrounding " +
  "--disable-features=CalculateNativeWinOcclusion,IntensiveWakeUpThrottling,TabFreezing,AutomaticTabDiscarding " +
  "--memory-pressure-off " +
  "> /tmp/chrome.log 2>&1 &";

/** Launches Chrome in the sandbox with remote debugging enabled. */
export async function launchChrome(sandbox: SandboxHandle): Promise<void> {
  try {
    await execHandle(sandbox, `bash -c "${CHROME_LAUNCH_CMD}"`, 5);
  } catch {
    // Non-fatal: Chrome launch failure shouldn't break the desktop
  }
}

/** Starts the sandbox desktop environment and launches Chrome. */
export async function startDesktopWithChrome(
  sandbox: SandboxHandle,
): Promise<void> {
  if (!sandbox.desktop) {
    return;
  }
  try {
    // Resolution comes from the VNC_RESOLUTION env var set at sandbox creation.
    await sandbox.desktop.start();
    try {
      // Wait for the X display to be ready before launching Chrome — avoids a
      // race where Chrome starts against an X server that isn't accepting
      // connections yet.
      await execHandle(
        sandbox,
        "for i in 1 2 3 4 5 6 7 8 9 10; do DISPLAY=:1 xdpyinfo > /dev/null 2>&1 && break; DISPLAY=:0 xdpyinfo > /dev/null 2>&1 && break; sleep 1; done",
        15,
      );
    } catch {
      // Non-fatal: continue and hope display is ready
    }
    await launchChrome(sandbox);
  } catch {
    // Non-fatal: entire desktop startup failure shouldn't block the workflow
  }
}
