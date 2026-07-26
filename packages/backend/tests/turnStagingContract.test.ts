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

test("the queued-message dequeue clears streamingActivity before staging", () => {
  const body = functionBody(
    queueHelpersSource,
    "startNextQueuedSessionMessage",
  );
  const clearAt = body.indexOf("await clearStreamingActivity(ctx");
  const userMessageAt = body.indexOf('role: "user"');
  expect(clearAt, "dequeue must clear streamingActivity").toBeGreaterThan(-1);
  expect(userMessageAt).toBeGreaterThan(-1);
  expect(clearAt).toBeLessThan(userMessageAt);
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
