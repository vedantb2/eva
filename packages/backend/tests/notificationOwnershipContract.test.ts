import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * A notification row belongs to exactly one user, and `v.id("notifications")`
 * is guessable from any other user's inbox — the id says nothing about who owns
 * the row. So every public notification function that takes one has to compare
 * the row's `userId` with the caller's before it reads or writes; `authMutation`
 * only proves *someone* is signed in.
 *
 * `markAsUnread` (ecb4d0d8c) was the second such mutation, added by mirroring
 * `markAsRead` by hand. A third one written the same way is where the check
 * gets dropped, and nothing else would notice: the patch succeeds, the victim's
 * unread badge moves, and no error is thrown. Hence a scan over every export
 * rather than an assertion about the two that exist today.
 */

const testsDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(
  join(testsDir, "../convex/notifications.ts"),
  "utf8",
);

/** Public (client-callable) notification functions, with their handler bodies. */
const publicFunctions = (() => {
  const matches = [
    ...source.matchAll(/export const (\w+) = (authQuery|authMutation)\(\{/g),
  ].map((match) => ({ name: match[1], kind: match[2], at: match.index }));
  return matches.map((entry, index) => ({
    ...entry,
    body: source.slice(entry.at, matches[index + 1]?.at ?? source.length),
  }));
})();

const idScoped = publicFunctions.filter((entry) =>
  entry.body.includes('v.id("notifications")'),
);

describe("notification ownership", () => {
  // Guards the scan itself: a rename of `authMutation` or of the file would
  // otherwise leave every assertion below passing over an empty list.
  it("finds the notification functions that take a row id", () => {
    expect(publicFunctions.map((entry) => entry.name)).toContain(
      "markAsUnread",
    );
    expect(idScoped.map((entry) => entry.name)).toEqual(
      expect.arrayContaining(["get", "markAsRead", "markAsUnread"]),
    );
  });

  it.each(idScoped.map((entry) => entry.name))(
    "%s refuses a row owned by another user",
    (name) => {
      const entry = idScoped.find((candidate) => candidate.name === name);
      expect(entry?.body).toContain("userId !== ctx.userId");
    },
  );

  it.each(
    idScoped
      .filter((entry) => entry.kind === "authMutation")
      .map((entry) => entry.name),
  )("%s checks ownership before patching", (name) => {
    const body = idScoped.find((candidate) => candidate.name === name)?.body;
    expect(body).toBeDefined();
    if (body === undefined) return;
    expect(body.indexOf("userId !== ctx.userId")).toBeLessThan(
      body.indexOf("ctx.db.patch"),
    );
  });

  // The bulk mutation takes no id, so its guard is the index range instead: it
  // must never collect across users.
  it("markAllAsRead scopes its query to the caller", () => {
    const body = publicFunctions.find(
      (entry) => entry.name === "markAllAsRead",
    )?.body;
    expect(body).toContain('q.eq("userId", ctx.userId)');
  });
});
