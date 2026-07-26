import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const executionSource = readFileSync(
  join(testsDir, "../convex/_sessions/execution.ts"),
  "utf8",
);

const queueHelpersSource = readFileSync(
  join(testsDir, "../convex/_queues/helpers.ts"),
  "utf8",
);

/**
 * A turn is staged in two places: `startExecute` (a fresh send) and the
 * queued-message dequeue. Both must wipe `streamingActivity` first.
 *
 * The daemon's post-completion reconcile heartbeat races the workflow's
 * `clearStreamingActivity` in `saveResult`. When the heartbeat lands last it
 * resurrects a row holding the finished turn's full activity, so the next
 * turn's placeholder flashes the previous turn's thinking trace. Clearing at
 * staging time makes the placeholder start clean whichever way the race lands.
 */
test("startExecute clears streamingActivity before staging the placeholder", () => {
  const clearAt = executionSource.indexOf(
    "await clearStreamingActivity(ctx, String(args.sessionId));",
  );
  const placeholderAt = executionSource.indexOf(
    'await ctx.db.insert("messages"',
  );
  expect(clearAt, "startExecute must clear streamingActivity").toBeGreaterThan(
    -1,
  );
  expect(placeholderAt).toBeGreaterThan(-1);
  expect(clearAt).toBeLessThan(placeholderAt);
});

/**
 * All four, not just the session one. They run the same daemon-reconcile
 * architecture, and callers cannot be relied on to clear first —
 * `_sessions/sandbox.ts` drains queued turns straight after a resume with no
 * clear of its own, so the staging point is the only place that covers every
 * entry.
 */
test.each([
  "startNextQueuedSessionMessage",
  "startNextQueuedDesignMessage",
  "startNextQueuedProjectChatMessage",
  "startNextQueuedTaskChatMessage",
])("%s clears streamingActivity before staging", (name) => {
  const body = functionBody(queueHelpersSource, name);
  const clearAt = body.indexOf("await clearStreamingActivity(");
  const userMessageAt = body.indexOf('role: "user"');
  expect(clearAt, `${name} must clear streamingActivity`).toBeGreaterThan(-1);
  expect(userMessageAt).toBeGreaterThan(-1);
  expect(clearAt).toBeLessThan(userMessageAt);
});

/**
 * Chat rows are keyed by a prefixed entityId, so clearing the bare id would pass
 * the ordering test above while leaving the stale row exactly where it was.
 */
test.each([
  {
    name: "startNextQueuedProjectChatMessage",
    prefix: "PROJECT_CHAT_STREAM_PREFIX",
    id: "projectId",
  },
  {
    name: "startNextQueuedTaskChatMessage",
    prefix: "TASK_CHAT_STREAM_PREFIX",
    id: "taskId",
  },
])("$name clears the prefixed streaming entityId", ({ name, prefix, id }) => {
  const body = functionBody(queueHelpersSource, name);
  expect(body).toContain(`\`\${${prefix}}\${String(${id})}\``);
});

/**
 * Slices from `export async function <name>` to the next top-level export, so an
 * ordering assertion cannot be satisfied by a match in a neighbouring helper.
 */
function functionBody(source: string, name: string): string {
  const startAt = source.indexOf(`export async function ${name}(`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const nextAt = source.indexOf("\nexport ", startAt + 1);
  return source.slice(startAt, nextAt < 0 ? undefined : nextAt);
}
