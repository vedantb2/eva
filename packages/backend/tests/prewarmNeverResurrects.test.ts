import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

function convexSource(path: string): string {
  return readFileSync(join(testsDir, "../convex", path), "utf8");
}

const executionSource = convexSource("_sandbox_runtime/execution.ts");
const snapshotSource = convexSource("_sandbox_runtime/daemonEntitySnapshot.ts");
const providerSource = convexSource("_sandbox/provider.ts");

/**
 * Opening a page fires prewarmDaemon, and on Vercel *any* exec — including the
 * daemon alive-check — lazily resumes a stopped VM. That resurrected VM has no
 * dev server, no Convex backend and no Console tmux session, because services
 * only launch in the startup workflow, so the user gets a "running" sandbox that
 * does nothing (fix 5eae18ba). Nothing else in the system can catch this: the
 * exec succeeds, the prewarm reports success, and the damage is a VM the user
 * never asked to wake.
 */
describe("prewarm never resurrects a stopped sandbox", () => {
  const prewarm = functionBody(
    executionSource,
    "async function runPrewarmEntityDaemon(",
  );

  test("bails on a non-running sandbox before any exec", () => {
    const guardAt = prewarm.indexOf('if (sandbox.state !== "running")');
    expect(
      guardAt,
      "runPrewarmEntityDaemon must gate on live provider state",
    ).toBeGreaterThan(-1);
    // Every way this file reaches into a sandbox. The first one must come after
    // the guard, since the first is the one that does the waking.
    for (const call of ["execHandle(", "sandbox.exec(", "execDetached("]) {
      const callAt = prewarm.indexOf(call);
      if (callAt < 0) continue;
      expect(
        callAt,
        `${call} runs before the state guard, so it can wake a stopped VM`,
      ).toBeGreaterThan(guardAt);
    }
  });

  /**
   * Prewarm is a background path, so it must never carry the explicit-start
   * escape hatch that waits out an in-flight stop.
   */
  test("does not opt into resume-after-stop", () => {
    expect(prewarm).not.toContain("resumeAfterStop");
  });

  /**
   * The states prewarm treats as definitely dead, read straight out of the
   * guard's condition.
   */
  const reconciledStates = [
    ...prewarm
      .slice(prewarm.indexOf('if (sandbox.state !== "running")'))
      .matchAll(/sandbox\.state === "(\w+)"/g),
  ].map(([, state]) => state);

  /**
   * A transient state means "ask again later", not "the sandbox is dead". Marking
   * one closed would strand a sandbox that is mid-resume behind a Start button.
   */
  test.each(["restoring", "starting", "unknown"])(
    "does not treat %s as dead",
    (state) => {
      expect(reconciledStates).not.toContain(state);
    },
  );

  /**
   * Fails when a new state joins SandboxState without a prewarm decision. That is
   * the point: a state nobody classified silently gets the "leave it alone"
   * branch, which is how a stale "active" status survives in the first place.
   */
  test("classifies every non-running state", () => {
    const union = providerSource.slice(
      providerSource.indexOf("export type SandboxState ="),
    );
    const states = [
      ...union.slice(0, union.indexOf(";")).matchAll(/"(\w+)"/g),
    ].map(([, state]) => state);
    expect(states).toContain("running");
    const transient = ["restoring", "starting", "unknown"];
    for (const state of states) {
      if (state === "running" || transient.includes(state)) continue;
      expect(
        reconciledStates,
        `${state} is neither running nor transient, so prewarm must reconcile it`,
      ).toContain(state);
    }
  });
});

/**
 * The self-heal half of the same fix: a stopped VM whose entity status still
 * reads "active" is what let the Console/PTY path resume it. Flipping to
 * "closed" is what makes the UI offer Start — the one path that relaunches
 * services — so the guards on that flip have to stay exact.
 */
describe("reconcileStoppedSandboxStatus", () => {
  const body = functionBody(
    snapshotSource,
    "export const reconcileStoppedSandboxStatus =",
  );

  /**
   * Split per entity table, so a guard present in the sessions branch cannot
   * stand in for one missing from projects.
   */
  const branches = [
    {
      table: "sessions",
      statusField: "doc.status",
      closed: 'status: "closed"',
    },
    {
      table: "agentTasks",
      statusField: "doc.reviewTaskSandboxStatus",
      closed: 'reviewTaskSandboxStatus: "closed"',
    },
    {
      table: "projects",
      statusField: "doc.reviewProjectSandboxStatus",
      closed: 'reviewProjectSandboxStatus: "closed"',
    },
  ];

  test.each(branches)(
    "$table flips only an exactly-active status",
    ({ table, statusField, closed }) => {
      const branch = entityBranch(body, table);
      // `!== "active"` and nothing looser: "starting"/"stopping"/"closed" belong
      // to the start and stop flows, which are mid-transition and own the field.
      expect(
        branch,
        `${table} must bail unless the status is exactly "active"`,
      ).toContain(`if (${statusField} !== "active") return null;`);
      expect(branch).toContain(closed);
    },
  );

  test.each(branches)(
    "$table only flips the sandbox the caller observed",
    ({ table }) => {
      const branch = entityBranch(body, table);
      // A newer sandbox on the doc means the entity already moved on, and
      // closing it would kill a live sandbox off a stale observation.
      expect(branch).toContain("doc.sandboxId !== args.sandboxId");
    },
  );
});

/**
 * `resumeAfterStop: true` is the one way for a start to win a race against a
 * stop, so it belongs to explicit user starts only. A background path that
 * picked it up could resume a sandbox the user had just stopped — the same
 * resurrection this whole file exists to prevent, arriving by a second route.
 *
 * The allow-list is per file rather than per call site, since the stop checks
 * that make it safe live in the callers and workflows, not beside the option.
 */
describe("resumeAfterStop call sites", () => {
  const files = [
    // tryResumeSandbox, reached only from prepareSandbox/createOrResumeSandbox.
    "_sandbox_runtime/git.ts",
    // resumeReusedSandbox and startDesignSandbox, both stop-checked either side.
    "_sandbox_runtime/sessions.ts",
    // ensureSandboxRunning itself: forwards the caller's option.
    "_sandbox_runtime/helpers.ts",
  ];

  test("all sit in a file on the allow-list", () => {
    const convexDir = join(testsDir, "../convex");
    const offenders = readdirSync(convexDir, { recursive: true })
      .map(String)
      .filter((path) => path.endsWith(".ts"))
      // Generated bundles are copies of source that is audited above.
      .filter((path) => !path.includes("_generated"))
      .filter((path) => !path.endsWith(".generated.ts"))
      .filter((path) => !files.includes(path.replaceAll("\\", "/")))
      .filter((path) =>
        readFileSync(join(convexDir, path), "utf8").includes(
          "resumeAfterStop: true",
        ),
      );
    expect(
      offenders,
      "only explicit user starts may wait out a stop — add a note above if this is one",
    ).toEqual([]);
  });

  /** The allow-list is worthless if it has drifted off the real call sites. */
  test("cover every allow-listed file", () => {
    for (const path of files) {
      expect(
        convexSource(path),
        `${path} no longer uses resumeAfterStop — drop it from the list`,
      ).toContain("resumeAfterStop");
    }
  });
});

/**
 * Slices from a declaration to the next top-level one, so an assertion cannot be
 * satisfied by a match in a neighbouring function.
 */
function functionBody(source: string, declaration: string): string {
  const startAt = source.indexOf(declaration);
  expect(startAt, `${declaration} moved or was renamed`).toBeGreaterThan(-1);
  const nextAt = source.indexOf("\nexport ", startAt + 1);
  return source.slice(startAt, nextAt < 0 ? undefined : nextAt);
}

/** One `if (args.entityTable === "…")` branch, or the trailing else for projects. */
function entityBranch(body: string, table: string): string {
  const marker = `if (args.entityTable === "${table}")`;
  const startAt = body.indexOf(marker);
  if (startAt > -1) {
    const nextAt = body.indexOf('if (args.entityTable === "', startAt + 1);
    return body.slice(startAt, nextAt < 0 ? undefined : nextAt);
  }
  // The last table needs no test, so it is the fall-through after the others.
  const lastAt = body.lastIndexOf('if (args.entityTable === "');
  expect(lastAt, `${table} has no branch`).toBeGreaterThan(-1);
  const tail = body.slice(lastAt);
  const endAt = tail.indexOf("\n    return null;\n  }");
  return tail.slice(endAt < 0 ? 0 : endAt);
}
