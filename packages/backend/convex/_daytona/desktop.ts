"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { exec } from "./helpers";

const CHROME_LAUNCH_CMD =
  "mkdir -p ~/.config/google-chrome/Default && " +
  "touch ~/.config/google-chrome/'First Run' && " +
  "(pgrep -f google-chrome > /dev/null 2>&1 || " +
  "DISPLAY=:1 nohup google-chrome-stable " +
  "--no-sandbox --disable-dev-shm-usage --start-maximized --window-size=1920,1080 " +
  "--remote-debugging-port=9222 --no-first-run --no-default-browser-check --disable-sync " +
  "> /tmp/chrome.log 2>&1 &)";

/** Sets the sandbox display resolution to 1920x1080 via xrandr. */
export async function setDisplayResolution(sandbox: Sandbox): Promise<void> {
  try {
    await exec(sandbox, "DISPLAY=:1 xrandr --fb 1920x1080", 10);
  } catch {
    try {
      await exec(
        sandbox,
        'DISPLAY=:1 xrandr --newmode "1920x1080" 0 1920 1920 1920 1920 1080 1080 1080 1080 && ' +
          'DISPLAY=:1 xrandr --addmode screen "1920x1080" && ' +
          'DISPLAY=:1 xrandr --output screen --mode "1920x1080"',
        10,
      );
    } catch {
      // Non-fatal: desktop still works at default 1024x768
    }
  }
}

/** Launches Chrome in the sandbox with remote debugging enabled. */
export async function launchChrome(sandbox: Sandbox): Promise<void> {
  try {
    await sandbox.process.executeCommand(
      `bash -c "${CHROME_LAUNCH_CMD}"`,
      "/",
      undefined,
      5,
    );
  } catch {
    // Non-fatal: Chrome launch failure shouldn't break the desktop
  }
}

/** Starts the sandbox desktop environment and launches Chrome. */
export async function startDesktopWithChrome(sandbox: Sandbox): Promise<void> {
  try {
    await sandbox.computerUse.start();
    try {
      await exec(
        sandbox,
        "for i in 1 2 3 4 5 6 7 8 9 10; do DISPLAY=:1 xdpyinfo > /dev/null 2>&1 && break; sleep 1; done",
        15,
      );
    } catch {
      // Non-fatal: continue and hope display is ready
    }
    await setDisplayResolution(sandbox);
    await launchChrome(sandbox);
  } catch {
    // Non-fatal: entire desktop startup failure shouldn't block the workflow
  }
}
