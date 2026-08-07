import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

function convexSource(path: string): string {
  return readFileSync(join(testsDir, "../convex", path), "utf8");
}

const chatWatchdog = convexSource("_chat/stallWatchdog.ts");
const taskWatchdog = convexSource("_taskWorkflow/watchdog.ts");
const staleness = convexSource("_taskWorkflow/staleness.ts");
const execution = convexSource("_sandbox_runtime/execution.ts");
const provider = convexSource("_sandbox/provider.ts");
const vercelProvider = convexSource("_sandbox/vercelProvider.ts");

/**
 * Vercel's `timeout` is a hard per-session runtime cap, not an idle timer. A
 * turn that outlives it is killed mid-work with NO snapshot, and the next
 * resume rolls the filesystem back to the pre-turn state — so the user loses
 * the work AND the evidence (observed twice in prod on 2026-08-06: a 59-minute
 * cursor turn on task 213, and session 53 the same morning).
 *
 * The guard is that both watchdogs slide the deadline forward on every tick of
 * a live turn. It is invisible until a turn runs long, which is exactly when it
 * is most expensive to get wrong, so the arithmetic is pinned here.
 */
describe("a live turn keeps its sandbox deadline ahead of the watchdog tick", () => {
  const watchdogs = [
    { name: "chat stall watchdog", source: chatWatchdog, gate: "if (!decision.stale) {" },
    { name: "task run watchdog", source: taskWatchdog, gate: "if (!isStale) {" },
  ];

  test.each(watchdogs)(
    "$name extends the deadline only while the turn is alive",
    ({ source, gate }) => {
      const gateAt = source.indexOf(gate);
      expect(gateAt, `the not-stale branch moved: ${gate}`).toBeGreaterThan(-1);
      const extendAt = source.indexOf(
        "internal.sandbox.extendSandboxDeadline",
        gateAt,
      );
      expect(
        extendAt,
        "a live turn must push the provider's hard runtime cap out or it is killed mid-work",
      ).toBeGreaterThan(-1);
      // Inside the not-stale branch, ahead of the reschedule that ends it.
      const rescheduleAt = source.indexOf("STALE_RECHECK_MS,", gateAt);
      expect(rescheduleAt).toBeGreaterThan(-1);
      expect(
        extendAt,
        "the extension must sit in the not-stale branch, not on the stale/kill path",
      ).toBeLessThan(rescheduleAt);
    },
  );

  /**
   * The single number that decides whether this works. Extending by exactly one
   * tick leaves zero slack, so any delayed or missed check lets the deadline
   * pass while the turn is still running — the same silent kill this fixed. Two
   * ticks keeps the deadline sliding ahead through a skipped cycle.
   */
  test.each(watchdogs)(
    "$name extends by more than one recheck interval",
    ({ source }) => {
      const args = source.slice(
        source.indexOf("internal.sandbox.extendSandboxDeadline"),
      );
      const duration = args.slice(0, args.indexOf("}")).match(
        /durationMs:\s*STALE_RECHECK_MS\s*\*\s*(\d+)/,
      );
      expect(
        duration,
        "the extension must be expressed in ticks, so retuning the tick cannot silently outrun it",
      ).not.toBeNull();
      expect(Number(duration?.[1]), "one tick of slack is none").toBeGreaterThan(
        1,
      );
    },
  );

  test("the recheck interval is short relative to any plausible extension", () => {
    expect(staleness).toContain("export const STALE_RECHECK_MS = 30_000;");
  });

  /**
   * Best-effort by contract: this runs on the hot path of every live turn, and
   * a provider hiccup here must never be what fails the turn.
   */
  test("extendSandboxDeadline swallows its own failures", () => {
    const startAt = execution.indexOf("export const extendSandboxDeadline");
    expect(startAt, "extendSandboxDeadline moved or was renamed").toBeGreaterThan(
      -1,
    );
    const nextAt = execution.indexOf("\nexport ", startAt + 1);
    const body = execution.slice(startAt, nextAt < 0 ? undefined : nextAt);
    expect(body).toContain("try {");
    expect(
      body,
      "a failed extension must not propagate into the watchdog tick",
    ).toContain("} catch (error) {");
    expect(body).toContain("sandbox.extendTimeout(args.durationMs)");
    // Getting a handle does not exec, so this must not be able to wake a
    // stopped sandbox the user deliberately stopped.
    expect(body).not.toContain("resumeAfterStop");
  });

  test("extendTimeout is part of the provider contract", () => {
    expect(provider).toContain("extendTimeout(durationMs: number): Promise<void>");
    expect(vercelProvider).toContain("async extendTimeout(durationMs: number)");
  });
});
