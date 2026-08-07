/** Entity-scoped warm-daemon marker paths on the sandbox filesystem. */

/**
 * Entity-scoped runner markers (I5 of the turn-lease design).
 *
 * The old markers were a single shared set — `/tmp/run-design.pid`,
 * `.ready`, `.done` — so a launch for one entity overwrote another's, and a
 * marker left by a previous turn read as if it belonged to the current one.
 * Scoping by entity plus a per-launch nonce in the ready payload means a marker
 * can only ever be believed by the launch that asked for it.
 *
 * Ownership is split deliberately: `launchPid` is the launcher's fact (the pid
 * it spawned), `pid` is the runner's own (written by the callback at boot).
 * Interrupt and liveness read `pid`, so they can never kill a pid nobody
 * confirmed was the runner.
 */
export type RunnerPaths = {
  /** Written by the callback at boot — the authoritative runner pid. */
  pid: string;
  /** Written by the launch script (`$!`) — used for OOM bias and dead-detection. */
  launchPid: string;
  /** Written by the callback once it is serving; payload is the launch id. */
  ready: string;
  /** Written by the callback's exit handler; absent means it was SIGKILLed. */
  done: string;
  /** Spawn flock held for the runner's lifetime (see launchScript). */
  lock: string;
};

export function entityRunnerPaths(
  entityIdField: string,
  entityId: string,
): RunnerPaths {
  const suffix = `${entityIdField}-${entityId}`;
  return {
    pid: `/tmp/eva-runner.${suffix}.pid`,
    launchPid: `/tmp/eva-runner.${suffix}.launchpid`,
    ready: `/tmp/eva-runner.${suffix}.ready`,
    done: `/tmp/eva-runner.${suffix}.done`,
    lock: `/tmp/eva-runner.${suffix}.lock`,
  };
}

/**
 * Matches every entity's runner pidfile. Callers holding only a sandbox id
 * (interrupt, liveness probes, post-mortem capture) use this — a sandbox
 * belongs to exactly one entity, so the glob resolves to at most one file.
 */
export const RUNNER_PID_GLOB = "/tmp/eva-runner.*.pid";
export const RUNNER_DONE_GLOB = "/tmp/eva-runner.*.done";

/** Pre-Phase-3 shared markers, still cleaned up on launch for old sandboxes. */
export const LEGACY_RUNNER_PID_FILE = "/tmp/run-design.pid";
export const LEGACY_RUNNER_READY_FILE = "/tmp/run-design.ready";
export const LEGACY_RUNNER_DONE_FILE = "/tmp/run-design.done";

export type DaemonPaths = {
  pid: string;
  entity: string;
  opts: string;
};

export function entityDaemonPaths(
  entityIdField: string,
  entityId: string,
): DaemonPaths {
  const suffix = `${entityIdField}-${entityId}`;
  return {
    pid: `/tmp/eva-daemon.${suffix}.pid`,
    entity: `/tmp/eva-daemon.${suffix}.entity`,
    opts: `/tmp/eva-daemon.${suffix}.opts`,
  };
}

const LEGACY_SESSION_DAEMON_PATHS: DaemonPaths = {
  pid: "/tmp/eva-daemon.pid",
  entity: "/tmp/eva-daemon.entity",
  opts: "/tmp/eva-daemon.opts",
};

function shellQuote(value: string): string {
  return JSON.stringify(value);
}

/** Shell snippet that prints alive | optsmismatch | stale | cold. */
export function buildDaemonAliveCheckCmd(
  entityIdField: string,
  entityId: string,
  fp: string,
  optsSig: string,
): string {
  const fpLit = shellQuote(fp);
  const optsLit = shellQuote(optsSig);
  const entityIdLit = shellQuote(entityId);
  const body =
    `if [ "$(cat /tmp/eva-callback-fp 2>/dev/null)" = ${fpLit} ]; then ` +
    `if [ "$(cat __OPTS__ 2>/dev/null)" = ${optsLit} ]; then echo alive; else echo optsmismatch; fi; ` +
    `else echo stale; fi`;

  function condition(paths: DaemonPaths): string {
    const pid = shellQuote(paths.pid);
    const entity = shellQuote(paths.entity);
    return (
      `[ -f ${pid} ] && kill -0 "$(cat ${pid})" 2>/dev/null && ` +
      `[ "$(cat ${entity} 2>/dev/null)" = ${entityIdLit} ]`
    );
  }

  function branch(paths: DaemonPaths): string {
    const branchBody = body.replace("__OPTS__", paths.opts);
    return `if ${condition(paths)}; then ${branchBody}`;
  }

  const scoped = entityDaemonPaths(entityIdField, entityId);
  if (entityIdField === "sessionId") {
    return `${branch(scoped)}; ${branch(LEGACY_SESSION_DAEMON_PATHS).replace(/^if /, "elif ")}; else echo cold; fi`;
  }
  return `${branch(scoped)}; else echo cold; fi`;
}

/** Kills the entity-scoped daemon (and legacy session markers when applicable). */
export function buildKillEntityDaemonCmd(
  entityIdField: string,
  entityId: string,
): string {
  const scoped = entityDaemonPaths(entityIdField, entityId);
  const parts = [
    `kill "$(cat ${shellQuote(scoped.pid)} 2>/dev/null)" 2>/dev/null || true`,
    `rm -f ${shellQuote(scoped.pid)} ${shellQuote(scoped.opts)} ${shellQuote(scoped.entity)}`,
  ];
  if (entityIdField === "sessionId") {
    const legacy = LEGACY_SESSION_DAEMON_PATHS;
    parts.push(
      `kill "$(cat ${shellQuote(legacy.pid)} 2>/dev/null)" 2>/dev/null || true`,
      `rm -f ${shellQuote(legacy.pid)} ${shellQuote(legacy.opts)} ${shellQuote(legacy.entity)}`,
    );
  }
  parts.push("true");
  return parts.join("; ");
}

export type DaemonMutationEnv = {
  claimMutation: string;
  openSyntheticTurnMutation: string;
  completeSyntheticTurnMutation: string;
  updateBackgroundAgentsMutation: string;
};

export const SESSION_DAEMON_MUTATIONS: DaemonMutationEnv = {
  claimMutation: "sessionWorkflow:claimPendingTurn",
  openSyntheticTurnMutation: "sessionWorkflow:openSyntheticTurn",
  completeSyntheticTurnMutation: "sessionWorkflow:completeSyntheticTurn",
  updateBackgroundAgentsMutation: "sessionWorkflow:updateBackgroundAgents",
};

export const TASK_CHAT_DAEMON_MUTATIONS: DaemonMutationEnv = {
  claimMutation: "agentTaskChatWorkflow:claimPendingTurn",
  openSyntheticTurnMutation: "agentTaskChatWorkflow:openSyntheticTurn",
  completeSyntheticTurnMutation: "agentTaskChatWorkflow:completeSyntheticTurn",
  updateBackgroundAgentsMutation:
    "agentTaskChatWorkflow:updateBackgroundAgents",
};

export const PROJECT_CHAT_DAEMON_MUTATIONS: DaemonMutationEnv = {
  claimMutation: "projectChatWorkflow:claimPendingTurn",
  openSyntheticTurnMutation: "projectChatWorkflow:openSyntheticTurn",
  completeSyntheticTurnMutation: "projectChatWorkflow:completeSyntheticTurn",
  updateBackgroundAgentsMutation: "projectChatWorkflow:updateBackgroundAgents",
};
