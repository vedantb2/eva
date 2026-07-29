import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

/**
 * An unanswered `pendingQuestions` row hides the chat composer. Stopping a
 * sandbox kills the paused turn, so the question can never be claimed — leaving
 * the row behind deadlocks the composer with no card to answer.
 *
 * Every entity kind that owns a sandbox has to clear on stop, so this asserts
 * all three teardown paths call the helper rather than only the one that got
 * reported.
 */
test("every sandbox stop path clears pending questions", () => {
  const paths = [
    "../convex/_sessions/sandbox.ts",
    "../convex/_agentTasks/sandbox.ts",
    "../convex/_projects/sandbox.ts",
  ];
  for (const path of paths) {
    const source = readFileSync(join(testsDir, path), "utf8");
    expect(source, `${path} must clear pending questions on stop`).toContain(
      "clearPendingQuestionsForEntity(ctx.db,",
    );
  }
});

/**
 * The teardown paths reach for the plain helper, not the `internalMutation`
 * wrapper — they already hold a mutation ctx, and a nested call would be a
 * needless scheduler hop.
 */
test("pendingQuestions exports the helper the teardown paths import", () => {
  const source = readFileSync(
    join(testsDir, "../convex/pendingQuestions.ts"),
    "utf8",
  );
  expect(source).toContain(
    "export async function clearPendingQuestionsForEntity",
  );
});
