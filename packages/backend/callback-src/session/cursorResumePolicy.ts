import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const CURSOR_MAX_RESUME_TURNS = 12;
export const CURSOR_MAX_RESUME_INPUT_TOKENS = 80_000;

export type CursorResumeStats = {
  turnNumber: number;
  inputTokens: number | null;
};

/** Reads the newest run for one agent from Cursor's append-only JSONL store. */
export function readCursorResumeStats(
  storeDir: string,
  agentId: string,
): CursorResumeStats | null {
  const runsFile = join(storeDir, "runs.ndjson");
  if (!existsSync(runsFile)) return null;

  try {
    const lines = readFileSync(runsFile, "utf8").split("\n");
    const agentNeedle = `"agentId":"${agentId}"`;
    for (let index = lines.length - 1; index >= 0; index--) {
      const line = lines[index];
      if (!line || !line.includes(agentNeedle)) continue;
      const turnMatch = /"turnNumber":(\d+)/.exec(line);
      const inputMatch = /"inputTokens":(\d+)/.exec(line);
      // A process death can leave a partial final JSONL record. Keep scanning
      // for the newest complete turn instead of forgetting all prior history.
      if (!turnMatch) continue;
      const turnNumber = Number(turnMatch[1]);
      if (!Number.isFinite(turnNumber)) continue;
      const inputTokens = inputMatch ? Number(inputMatch[1]) : null;
      if (inputTokens !== null && !Number.isFinite(inputTokens)) continue;
      return { turnNumber, inputTokens };
    }
  } catch (error) {
    console.error("Failed to inspect Cursor resume history:", String(error));
  }
  return null;
}

/** Prevents an ever-growing checkpoint from turning tiny prompts into multi-minute replays. */
export function shouldRotateCursorSession(
  stats: CursorResumeStats | null,
): boolean {
  if (stats === null) return false;
  return (
    stats.turnNumber >= CURSOR_MAX_RESUME_TURNS ||
    (stats.inputTokens !== null &&
      stats.inputTokens >= CURSOR_MAX_RESUME_INPUT_TOKENS)
  );
}
