import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const queuedMessagesSource = readFileSync(
  join(testsDir, "../convex/queuedMessages.ts"),
  "utf8",
);

const queueHelpersSource = readFileSync(
  join(testsDir, "../convex/_queues/helpers.ts"),
  "utf8",
);

/**
 * A queued message's attachments are uploaded for that message alone, so
 * deleting the row without deleting the blobs leaks them into `_storage`
 * forever with nothing referencing them.
 */
test("queuedMessages.remove deletes the row's attachment blobs", () => {
  const deleteRowAt = queuedMessagesSource.indexOf(
    "await ctx.db.delete(args.id);",
  );
  const deleteBlobsAt = queuedMessagesSource.indexOf(
    "await ctx.storage.delete(storageId);",
  );
  expect(deleteRowAt).toBeGreaterThan(-1);
  expect(
    deleteBlobsAt,
    "remove must reclaim attachmentStorageIds, or the blobs leak",
  ).toBeGreaterThan(-1);
  expect(queuedMessagesSource).toContain(
    "for (const storageId of queuedMessage.attachmentStorageIds ?? [])",
  );
});

/**
 * The other half of the invariant: dequeuing deletes the queued row too, but it
 * hands the same storage ids to the `messages` row, so it must NOT delete the
 * blobs. Every dequeue site is checked because a new one that forgets the
 * hand-off would silently drop a user's attachments.
 */
test("every dequeue hands attachments to the messages row instead of deleting them", () => {
  const rowDeletes = countOccurrences(
    queueHelpersSource,
    "await ctx.db.delete(nextMessage._id);",
  );
  const handOffs = countOccurrences(
    queueHelpersSource,
    "attachmentStorageIds: nextMessage.attachmentStorageIds,",
  );
  expect(rowDeletes).toBeGreaterThan(0);
  expect(
    handOffs,
    "each dequeue must copy attachmentStorageIds onto the messages row",
  ).toBe(rowDeletes);
  expect(
    queueHelpersSource,
    "dequeue must not delete blobs the messages row now owns",
  ).not.toContain("ctx.storage.delete");
});

function countOccurrences(source: string, needle: string): number {
  let count = 0;
  let from = 0;
  while (from < source.length) {
    const at = source.indexOf(needle, from);
    if (at < 0) break;
    count += 1;
    from = at + needle.length;
  }
  return count;
}
