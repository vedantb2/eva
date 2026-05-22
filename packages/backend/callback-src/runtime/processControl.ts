import { spawnSync } from "child_process";
import type { ChildProcess } from "child_process";

/** Sends SIGTERM then SIGKILL to forcefully stop a CLI process. */
export function terminateAttemptProcess(child: ChildProcess): void {
  try {
    child.kill("SIGTERM");
  } catch {
    /* ignore kill errors */
  }
  setTimeout(() => {
    try {
      child.kill("SIGKILL");
    } catch {
      /* ignore kill errors */
    }
  }, 2000);
}

/** True when pid is a zombie process (state Z). */
export function isChildZombie(pid: number | undefined): boolean {
  if (!pid) return false;
  try {
    const result = spawnSync("ps", ["-p", String(pid), "-o", "state="], {
      timeout: 2000,
      encoding: "utf8",
    });
    if (result.error || result.status !== 0) return false;
    return (result.stdout || "").trim() === "Z";
  } catch {
    return false;
  }
}
