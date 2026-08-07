import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const daemonSource = readFileSync(
  join(testsDir, "../callback-src/providers/claudeSdkDaemon.ts"),
  "utf8",
);

const OWNERSHIP_GATE = "if (readDaemonPidFile() === process.pid) {";

/**
 * The pidfile IS the single-daemon fence: whoever owns it is the daemon for the
 * entity, and every other daemon reads it on an interval and exits when it no
 * longer names them. So an unlink by a daemon that has already been deposed
 * does not clean up after itself — it deletes the RIVAL's claim, the healthy
 * rival reads owner=none, and the entity is left with zero daemons (fix
 * f48e06fe: failTurnAndExit and exitWithoutCompletion both did exactly this).
 *
 * The failure is silent and remote — a turn that simply never gets picked up —
 * so the only cheap guard is structural: every teardown path that removes a
 * marker file must sit directly inside the ownership gate. New exit paths are
 * added to this file regularly, which is precisely the regression risk.
 */
describe("daemon marker files are only removed by their owner", () => {
  const unlinks = [
    ...daemonSource.matchAll(/unlinkSync\(DAEMON_(?:PID|ENTITY|OPTS)_FILE\)/g),
  ];

  test("the teardown paths this pins still exist", () => {
    // Boot claim, deposition fence, failTurnAndExit, exitWithoutCompletion and
    // the runSdkDaemon finally block — a drop here means a path was removed,
    // not that the contract got easier.
    expect(unlinks.length).toBeGreaterThanOrEqual(3);
    expect(daemonSource).toContain("async function failTurnAndExit(");
    expect(daemonSource).toContain("async function exitWithoutCompletion(");
  });

  test.each(unlinks.map((match, index) => [index, match.index] as const))(
    "unlink #%i is wrapped in the ownership gate",
    (_index, at) => {
      const gateAt = daemonSource.lastIndexOf(OWNERSHIP_GATE, at);
      expect(
        gateAt,
        "this unlink can run while a rival owns the pidfile, taking the healthy daemon down with it",
      ).toBeGreaterThan(-1);
      // Directly inside the gate: only a `try {`, comments, and sibling marker
      // unlinks sharing the same try may sit between. A wider gap means the
      // gate closed before the unlink, or another branch snuck in.
      const between = daemonSource
        .slice(gateAt + OWNERSHIP_GATE.length, at)
        .replace(/^\s*\/[/*].*$/gm, "")
        .replace(/unlinkSync\(DAEMON_(?:PID|ENTITY|OPTS)_FILE\);/g, "")
        .trim();
      expect(
        between,
        "the unlink is no longer directly under the ownership gate",
      ).toBe("try {");
    },
  );

  /**
   * The legacy session-scoped markers are pre-entity-id leftovers cleaned up on
   * the same path. They name a fixed path shared across daemons, so they are
   * subject to the identical rival-deletion hazard.
   */
  test("legacy session markers are cleaned up under the same gate", () => {
    const legacyAt = daemonSource.indexOf("resolveLegacySessionDaemonPaths()");
    expect(legacyAt).toBeGreaterThan(-1);
    expect(
      daemonSource.lastIndexOf(OWNERSHIP_GATE, legacyAt),
      "legacy marker cleanup must not run from a deposed daemon either",
    ).toBeGreaterThan(-1);
  });

  /**
   * The boot claim is the one place that writes the pidfile, and it must only
   * do so after checking for a live rival — otherwise two daemons claim the
   * same entity and flip-flop the shared streaming row.
   */
  test("the boot claim checks for a live rival before writing the pidfile", () => {
    const rivalAt = daemonSource.indexOf("const rivalPid = readDaemonPidFile()");
    const writeAt = daemonSource.indexOf(
      "writeFileSync(DAEMON_PID_FILE, String(process.pid))",
    );
    expect(rivalAt, "the boot claim's rival probe moved").toBeGreaterThan(-1);
    expect(writeAt).toBeGreaterThan(-1);
    expect(
      rivalAt,
      "claiming the pidfile before probing lets two daemons own one entity",
    ).toBeLessThan(writeAt);
    expect(daemonSource.slice(rivalAt, writeAt)).toContain("pidAlive(rivalPid)");
  });
});
