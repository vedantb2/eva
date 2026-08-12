const LANE_KEY_PATTERN = /^[a-z0-9_-]+$/i;

export type RunnerPaths = {
  laneDir: string | undefined;
  prompt: string;
  launchScript: string;
  pid: string;
  ready: string;
  done: string;
  rawLog: string;
  log: string;
  mcpConfig: string;
  systemSkills: string;
  attachmentsDir: string;
  claudeRuntimeDir: string;
  codexRuntimeDir: string;
  opencodeRuntimeDir: string;
  cursorRuntimeDir: string;
};

/** Validates a lane key before it becomes a sandbox path segment. */
export function laneDirectory(laneKey: string): string {
  if (!LANE_KEY_PATTERN.test(laneKey)) {
    throw new Error("Invalid sandbox lane key");
  }
  return `/tmp/eva-lanes/${laneKey}`;
}

/**
 * Resolves every mutable callback path together. The default lane deliberately
 * keeps the legacy locations so existing sandboxes and in-flight callbacks
 * continue to work; side chats get an isolated directory.
 */
export function runnerPaths(laneKey?: string): RunnerPaths {
  if (laneKey === undefined) {
    return {
      laneDir: undefined,
      prompt: "/tmp/design-prompt.txt",
      launchScript: "/tmp/eva-launch-runner.sh",
      pid: "/tmp/run-design.pid",
      ready: "/tmp/run-design.ready",
      done: "/tmp/run-design.done",
      rawLog: "/tmp/run-design.raw.jsonl",
      log: "/tmp/design.log",
      mcpConfig: "/tmp/eva-mcp.json",
      systemSkills: "/tmp/eva-system-skills.json",
      attachmentsDir: "/tmp",
      claudeRuntimeDir: "/tmp/claude-config",
      codexRuntimeDir: "/tmp/codex-home",
      opencodeRuntimeDir: "/tmp/opencode-home",
      cursorRuntimeDir: "/tmp/cursor-home",
    };
  }

  const laneDir = laneDirectory(laneKey);
  return {
    laneDir,
    prompt: `${laneDir}/prompt.txt`,
    launchScript: `${laneDir}/launch-runner.sh`,
    pid: `${laneDir}/run.pid`,
    ready: `${laneDir}/ready`,
    done: `${laneDir}/done`,
    rawLog: `${laneDir}/raw.jsonl`,
    log: `${laneDir}/run.log`,
    mcpConfig: `${laneDir}/eva-mcp.json`,
    systemSkills: `${laneDir}/system-skills.json`,
    attachmentsDir: `${laneDir}/attachments`,
    claudeRuntimeDir: `${laneDir}/claude-config`,
    codexRuntimeDir: `${laneDir}/codex-home`,
    opencodeRuntimeDir: `${laneDir}/opencode-home`,
    cursorRuntimeDir: `${laneDir}/cursor-home`,
  };
}

/** Process-group scoped cancellation for one lane. */
export function buildKillLaneCommand(laneKey?: string): string {
  const paths = runnerPaths(laneKey);
  const pid = JSON.stringify(paths.pid);
  return [
    `pid=$(cat ${pid} 2>/dev/null || true)`,
    'if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then kill -TERM -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true; fi',
    'if [ -n "$pid" ]; then pkill -TERM -g "$pid" -x claude 2>/dev/null || true; pkill -TERM -g "$pid" -x claude-code 2>/dev/null || true; pkill -TERM -g "$pid" -x codex 2>/dev/null || true; pkill -TERM -g "$pid" -x opencode 2>/dev/null || true; pkill -TERM -g "$pid" -x cursor-agent 2>/dev/null || true; fi',
    `rm -f ${pid} ${JSON.stringify(paths.ready)} ${JSON.stringify(paths.done)}`,
    "true",
  ].join("; ");
}

/** Recovery/stop-only kill that intentionally tears down every callback lane. */
export const KILL_ALL_LANES_COMMAND = [
  buildKillLaneCommand(),
  'for lane in /tmp/eva-lanes/*; do [ -d "$lane" ] || continue; pid=$(cat "$lane/run.pid" 2>/dev/null || true); if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then kill -TERM -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true; fi; done',
  "true",
].join("; ");
