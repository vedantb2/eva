/** Entity-scoped warm-daemon marker paths on the sandbox filesystem. */

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

function entityDaemonLaunchLockPath(
  entityIdField: string,
  entityId: string,
): string {
  return `/tmp/eva-daemon.${entityIdField}-${entityId}.launch-lock`;
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

/**
 * Atomically leases daemon inspection + launch to one concurrent prewarm.
 * The timestamp lets a later request recover if an action dies before release.
 */
export function buildAcquireDaemonLaunchLockCmd(
  entityIdField: string,
  entityId: string,
  ownerToken: string,
): string {
  const lock = shellQuote(entityDaemonLaunchLockPath(entityIdField, entityId));
  const owner = shellQuote(ownerToken);
  return (
    `lock=${lock}; owner=${owner}; now=$(date +%s); ` +
    'if mkdir "$lock" 2>/dev/null; then ' +
    'printf "%s" "$now" > "$lock/created-at"; printf "%s" "$owner" > "$lock/owner"; echo acquired; ' +
    'else created_at=$(cat "$lock/created-at" 2>/dev/null || printf "%s" "$now"); ' +
    'if [ "$((now - created_at))" -gt 120 ]; then ' +
    'rm -f "$lock/created-at" "$lock/owner"; rmdir "$lock" 2>/dev/null || true; ' +
    'if mkdir "$lock" 2>/dev/null; then ' +
    'printf "%s" "$now" > "$lock/created-at"; printf "%s" "$owner" > "$lock/owner"; echo acquired; ' +
    "else echo busy; fi; else echo busy; fi; fi"
  );
}

/** Releases an entity's daemon-launch lease after the owner finishes. */
export function buildReleaseDaemonLaunchLockCmd(
  entityIdField: string,
  entityId: string,
  ownerToken: string,
): string {
  const lock = shellQuote(entityDaemonLaunchLockPath(entityIdField, entityId));
  const owner = shellQuote(ownerToken);
  return (
    `lock=${lock}; owner=${owner}; ` +
    'if [ "$(cat "$lock/owner" 2>/dev/null)" = "$owner" ]; then ' +
    'rm -f "$lock/created-at" "$lock/owner"; rmdir "$lock" 2>/dev/null || true; fi'
  );
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
