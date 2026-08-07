import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

function convexSource(path: string): string {
  return readFileSync(join(testsDir, "../convex", path), "utf8");
}

const turnStore = convexSource("_chat/turnStore.ts");
const runLease = convexSource("_taskWorkflow/runLease.ts");
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
 * The guard is that lease renewal slides the deadline forward. Hanging it off
 * renewal rather than a watchdog tick is what ties the VM's life to a live
 * owner: a dead turn stops renewing, so it stops extending. It is invisible
 * until a turn runs long, which is exactly when it is most expensive to get
 * wrong, so the arithmetic is pinned here.
 */
describe("a live turn keeps its sandbox deadline ahead of its own lease", () => {
  const renewals = [
    { name: "chat turn renewal", source: turnStore },
    { name: "task run renewal", source: runLease },
  ];

  /**
   * The single number that decides whether this works. Extending by exactly one
   * lease leaves zero slack, so any delayed or missed heartbeat lets the
   * deadline pass while the turn is still running — the same silent kill this
   * fixed. Two keeps the deadline sliding ahead through a skipped cycle.
   */
  test.each(renewals)(
    "$name extends by more than one lease duration",
    ({ source }) => {
      const args = source.slice(
        source.indexOf("internal.sandbox.extendSandboxDeadline"),
      );
      const duration = args
        .slice(0, args.indexOf("}"))
        .match(/durationMs:\s*durationMs\s*\*\s*(\d+)/);
      expect(
        duration,
        "the extension must be expressed in lease durations, so retuning a lease cannot silently outrun it",
      ).not.toBeNull();
      expect(
        Number(duration?.[1]),
        "one lease of slack is none",
      ).toBeGreaterThan(1);
    },
  );

  /**
   * Best-effort by contract: this runs on the hot path of every live turn, and
   * a provider hiccup here must never be what fails the turn.
   */
  test("extendSandboxDeadline swallows its own failures", () => {
    const startAt = execution.indexOf("export const extendSandboxDeadline");
    expect(
      startAt,
      "extendSandboxDeadline moved or was renamed",
    ).toBeGreaterThan(-1);
    const nextAt = execution.indexOf("\nexport ", startAt + 1);
    const body = execution.slice(startAt, nextAt < 0 ? undefined : nextAt);
    expect(body).toContain("try {");
    expect(
      body,
      "a failed extension must not propagate into the renewal",
    ).toContain("} catch (error) {");
    expect(body).toContain("sandbox.extendTimeout(args.durationMs)");
    // Getting a handle does not exec, so this must not be able to wake a
    // stopped sandbox the user deliberately stopped.
    expect(body).not.toContain("resumeAfterStop");
  });

  test("extendTimeout is part of the provider contract", () => {
    expect(provider).toContain(
      "extendTimeout(durationMs: number): Promise<void>",
    );
    expect(vercelProvider).toContain("async extendTimeout(durationMs: number)");
  });
});
