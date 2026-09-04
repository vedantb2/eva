import { readFileSync } from "fs";

const CALLBACK_FINGERPRINT_PATH = "/tmp/eva-callback-fp";

/** Resolves after `ms`. Shared by daemon poll loops and question waits. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** True when `pid` refers to a live process this user can signal. */
export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * True when a newer callback bundle was uploaded while this daemon is running.
 * The daemon then stops claiming so the next prewarm can spawn with fresh code.
 */
export function callbackBundleWentStale(expectedFingerprint: string): boolean {
  if (!expectedFingerprint) return false;
  try {
    return (
      readFileSync(CALLBACK_FINGERPRINT_PATH, "utf8").trim() !==
      expectedFingerprint
    );
  } catch {
    return false;
  }
}
