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
 * The three queue arms (session, project chat, task chat) no longer stage
 * their own turns — they are thin `ChatQueueConfig` bindings onto one shared
 * dequeue (`startNextQueuedChatMessage` in convex/_queues/helpers.ts), so the
 * clear-before-stage order is that shared function's property now, not each
 * config's own.
 */
test("the shared dequeue clears streamingActivity before staging the exact turn pair", () => {
  const body = functionBody(
    queueHelpersSource,
    "async function startNextQueuedChatMessage<",
  );
  const clearAt = body.indexOf("await clearStreamingActivity(");
  const insertAt = body.indexOf("config.insertMessages(");
  expect(
    clearAt,
    "startNextQueuedChatMessage must clear streamingActivity",
  ).toBeGreaterThan(-1);
  expect(insertAt).toBeGreaterThan(-1);
  expect(clearAt).toBeLessThan(insertAt);
});

/**
 * Each config still stages a user-role message when its turn is dequeued —
 * that part of the behavior is per-surface (message shape differs), even
 * though the shared core now owns the clear-then-insert ordering.
 */
test.each([
  "sessionQueueConfig",
  "projectChatQueueConfig",
  "taskChatQueueConfig",
])("%s inserts a user-role message", (name) => {
  const body = configBody(queueHelpersSource, name);
  expect(body).toContain('role: "user"');
});

/**
 * Chat rows are keyed by a prefixed entityId, so clearing the bare id would
 * pass the ordering test above while leaving the stale row exactly where it
 * was. Each config's `streamingEntityId` closure is what the shared core
 * calls to compute the key it clears.
 */
test.each([
  { name: "projectChatQueueConfig", prefix: "PROJECT_CHAT_STREAM_PREFIX" },
  { name: "taskChatQueueConfig", prefix: "TASK_CHAT_STREAM_PREFIX" },
])("$name's streamingEntityId uses the prefixed key", ({ name, prefix }) => {
  const body = configBody(queueHelpersSource, name);
  expect(body).toContain(`\`\${${prefix}}\${String(id)}\``);
});

/**
 * Slices from a top-level function header to the `\n}` that closes it at
 * column 0 — nested closing braces stay indented so they cannot satisfy this.
 */
function functionBody(source: string, header: string): string {
  const startAt = source.indexOf(header);
  expect(startAt, `${header} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n}", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

/** One `const name: SomeConfig<...> = {...}` object literal, ending on the `\n};` that closes it. */
function configBody(source: string, name: string): string {
  const startAt = source.indexOf(`const ${name}:`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n};", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}
