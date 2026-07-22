import { ENTITY_ID, ENTITY_ID_FIELD } from "../config.js";

const LEGACY_DAEMON_PID = "/tmp/eva-daemon.pid";
const LEGACY_DAEMON_ENTITY = "/tmp/eva-daemon.entity";
const LEGACY_DAEMON_OPTS = "/tmp/eva-daemon.opts";

export type DaemonPaths = {
  pid: string;
  entity: string;
  opts: string;
};

/** Entity-scoped daemon marker paths so multiple daemons can coexist on one sandbox. */
export function resolveDaemonPaths(
  entityIdField: string | undefined = ENTITY_ID_FIELD,
  entityId: string | undefined = ENTITY_ID,
): DaemonPaths {
  const field = entityIdField ?? "sessionId";
  const id = entityId ?? "";
  const suffix = `${field}-${id}`;
  return {
    pid: `/tmp/eva-daemon.${suffix}.pid`,
    entity: `/tmp/eva-daemon.${suffix}.entity`,
    opts: `/tmp/eva-daemon.${suffix}.opts`,
  };
}

/** Session daemons written entity-scoped paths before the suffix migration. */
export function resolveLegacySessionDaemonPaths(): DaemonPaths {
  return {
    pid: LEGACY_DAEMON_PID,
    entity: LEGACY_DAEMON_ENTITY,
    opts: LEGACY_DAEMON_OPTS,
  };
}
