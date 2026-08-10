import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const callback = readFileSync(
  join(testsDir, "../callback-src/index.ts"),
  "utf8",
)
  .replaceAll("\r\n", "\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^[^\S\n]*\/\/.*$/gm, "");

const sessionWorkflow = readFileSync(
  join(testsDir, "../convex/_sessions/workflow.ts"),
  "utf8",
)
  .replaceAll("\r\n", "\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^[^\S\n]*\/\/.*$/gm, "");

/**
 * A completed one-shot runner used to outlive its own turn. The success path
 * reported completion and then fell off the end of the script instead of
 * exiting, so a tool step's background child still holding our stdio fds kept
 * the event loop alive forever (fix 70fbc3ec, prod session 53).
 *
 * The zombie is expensive twice over: it keeps the per-entity spawn flock, so
 * every later launch for the entity loses the lock and dies, and the stall
 * watchdog's liveness probe sees its PID as alive and keeps extending the
 * sandbox deadline. The chat sticks on "Working…" with no error at all — which
 * is exactly why this needs a structural guard rather than a report from prod.
 */
describe("the one-shot runner exits on every terminal path", () => {
  const completion = callback.slice(
    callback.indexOf("await deliverCompletionWithMedia("),
  );

  test("the success path hard-exits after the done file is written", () => {
    const doneAt = completion.indexOf("writeDoneFile(");
    const exitAt = completion.indexOf("process.exit(0);");
    const catchAt = completion.indexOf("} catch (e) {");
    expect(doneAt, "the success done file moved").toBeGreaterThan(-1);
    expect(exitAt, "the success path no longer exits").toBeGreaterThan(-1);
    expect(catchAt, "the completion handler moved").toBeGreaterThan(-1);
    expect(
      doneAt,
      "the done file is the durable record; write it first",
    ).toBeLessThan(exitAt);
    expect(
      exitAt,
      "the exit belongs on the success path, not in the handler",
    ).toBeLessThan(catchAt);
  });

  /**
   * The neighbouring failure paths already exited; the success path was the
   * only hole. Losing any of them reopens the same zombie.
   */
  test("the failure paths still exit non-zero", () => {
    expect(completion).toContain("process.exit(1);");
  });
});

/**
 * The other half of the same stuck chat: `launchOnExistingSandbox` throwing
 * killed the workflow inside the workflow component, so no `saveResult` ever
 * ran. The empty placeholder and `activeWorkflowId` stayed put and the turn sat
 * on "Working…" until the two-hour backstop, with nothing to tell the user
 * (fix 70fbc3ec).
 */
describe("a failed launch finalizes the turn", () => {
  const launchAt = sessionWorkflow.indexOf(
    "internal.sandbox.launchOnExistingSandbox",
  );

  test("the launch step is wrapped", () => {
    expect(launchAt, "the launch step moved").toBeGreaterThan(-1);
    const tryAt = sessionWorkflow.lastIndexOf("try {", launchAt);
    const catchAt = sessionWorkflow.indexOf("} catch (error) {", launchAt);
    expect(tryAt, "the launch is unguarded again").toBeGreaterThan(-1);
    expect(catchAt, "the launch has no handler").toBeGreaterThan(-1);
  });

  /**
   * Swallowing the failure would be worse than dying: the turn would hang on a
   * completion event that can never arrive. It has to save a failed result and
   * stop, which is what releases `activeWorkflowId`.
   */
  test("its handler saves a failed result and stops", () => {
    const catchAt = sessionWorkflow.indexOf("} catch (error) {", launchAt);
    const handler = sessionWorkflow.slice(
      catchAt,
      sessionWorkflow.indexOf("\n      }", catchAt),
    );
    expect(handler).toContain("internal.sessionWorkflow.saveResult");
    expect(handler, "a successful result would hide the failure").toContain(
      "success: false",
    );
    expect(handler, "the error has to reach the user").toContain("error");
    expect(
      handler,
      "falling through waits for an event that never comes",
    ).toContain("return;");
  });

  /** The handler runs before the workflow starts waiting to be completed. */
  test("it returns before the completion event is awaited", () => {
    const awaitAt = sessionWorkflow.indexOf(
      "step.awaitEvent(sessionCompleteEvent)",
    );
    expect(awaitAt, "the completion await moved").toBeGreaterThan(-1);
    expect(launchAt).toBeLessThan(awaitAt);
  });
});
