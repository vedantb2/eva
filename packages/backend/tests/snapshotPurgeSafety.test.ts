import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  EPHEMERAL_SNAPSHOT_TTL_MS,
  KEEP_LAST_SNAPSHOTS,
  vercelSnapshotCreateOptions,
} from "../convex/_sandbox/vercelSnapshotOptions";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

/** Comments in these files name the very calls the ordering rules rule out. */
const purgeSource = stripComments(
  readFileSync(join(convexDir, "snapshotActions.ts"), "utf8"),
);
// Scoped to the sandbox handle: the file also holds a VercelDesktop with its own
// unrelated stop(), which a whole-file search picks up first.
const providerSource = classBody(
  stripComments(
    readFileSync(join(convexDir, "_sandbox/vercelProvider.ts"), "utf8"),
  ),
  "VercelSandboxHandle",
);

/**
 * A snapshot deleted by mistake is unrecoverable: it is the entire filesystem of
 * a session, quick task, or project sandbox. The purge therefore has to know
 * everything worth keeping *before* it deletes anything — a protected id added
 * after the delete loop starts protects nothing (fix b6ad8dbd).
 *
 * Source-text, because the failure mode is an ordering mistake in one action and
 * exercising it for real would mean deleting production snapshots.
 */
describe("purgeUnreferencedVercelSnapshots builds its protected set first", () => {
  const body = definitionBody(purgeSource, "purgeUnreferencedVercelSnapshots");
  const firstDeleteAt = body.indexOf("await snap.delete()");

  test("deletes something at all", () => {
    expect(firstDeleteAt, "the delete moved or was renamed").toBeGreaterThan(
      -1,
    );
  });

  test("reads the persisted protected ids before deleting", () => {
    const readAt = body.indexOf(
      "internal.repoSnapshots.listAllProtectedSnapshotIds",
    );
    expect(readAt, "protected-id query moved or was renamed").toBeGreaterThan(
      -1,
    );
    expect(readAt).toBeLessThan(firstDeleteAt);
  });

  /**
   * A live sandbox's resume snap is not recorded anywhere in Convex, so the only
   * way to know it matters is to enumerate the sandboxes that still exist —
   * filtered to ids Eva still references (ghosts in Sandbox.list are orphans).
   */
  test("enumerates live sandboxes before deleting", () => {
    const listAt = body.indexOf("await Sandbox.list(creds)");
    expect(listAt, "live-sandbox enumeration moved").toBeGreaterThan(-1);
    expect(listAt).toBeLessThan(firstDeleteAt);
  });

  test("only protects sandboxes Eva still references", () => {
    expect(body).toContain(
      "internal.repoSnapshots.listReferencedSandboxIds",
    );
    expect(body).toContain("knownSandboxIds.has(sandbox.name)");
  });

  test.each([
    ["the sandbox's current snapshot", "protectedIds.add(currentId)"],
  ])("protects %s", (_label, call) => {
    const addAt = body.indexOf(call);
    expect(addAt, `${call} moved or was renamed`).toBeGreaterThan(-1);
    expect(addAt).toBeLessThan(firstDeleteAt);
  });

  /** Older snaps under a live sandbox name are orphans — only currentSnapshotId resumes. */
  test("does not blanket-protect every snap listed by sandbox name", () => {
    expect(body).not.toContain(
      "Snapshot.list({ ...creds, name: sandbox.name })",
    );
  });

  /** No `protectedIds.add` may run once deleting has begun. */
  test("adds nothing to the protected set after the first delete", () => {
    expect(body.slice(firstDeleteAt)).not.toContain("protectedIds.add(");
  });

  test("skips protected snapshots", () => {
    const guardAt = body.indexOf("if (protectedIds.has(meta.id))");
    expect(guardAt, "the protected-id guard moved").toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(firstDeleteAt);
  });

  test("only deletes created snapshots", () => {
    expect(body).toContain('String(meta.status) !== "created"');
  });

  /**
   * `Snapshot.list` yields plain metadata with no `.delete()` — deleting straight
   * off the listed object threw on every snapshot, so the purge silently did
   * nothing (fix 1ecbb980).
   */
  test("re-hydrates each snapshot before deleting it", () => {
    const getAt = body.indexOf("await Snapshot.get({");
    expect(getAt, "Snapshot.get moved or was renamed").toBeGreaterThan(-1);
    expect(getAt).toBeLessThan(firstDeleteAt);
    expect(body).toContain("snapshotId: meta.id");
  });
});

/**
 * Retention is the cheap half of the same problem: a persistent sandbox
 * auto-snapshots on every stop, so without a cap each stop/resume cycle leaves
 * another billed snap_* behind (fix b952fb3b).
 */
describe("keepLastSnapshots is applied wherever a snapshot is written", () => {
  test("caps a lineage at one snapshot and deletes what it evicts", () => {
    expect(KEEP_LAST_SNAPSHOTS.count).toBe(1);
    expect(KEEP_LAST_SNAPSHOTS.deleteEvicted).toBe(true);
  });

  test("gives evicted snapshots an explicit TTL", () => {
    // Inheriting a seed snap's expiration:0 means never-expire storage.
    expect(KEEP_LAST_SNAPSHOTS.expiration).toBeGreaterThan(0);
  });

  test("only persistent sandboxes get retention at create time", () => {
    expect(vercelSnapshotCreateOptions(true).keepLastSnapshots).toBe(
      KEEP_LAST_SNAPSHOTS,
    );
    expect(
      vercelSnapshotCreateOptions(false).keepLastSnapshots,
    ).toBeUndefined();
  });

  /** Vercel rejects any snapshotExpiration between 0 and one day. */
  test("every create-time TTL is zero or at least a day", () => {
    const day = 24 * 60 * 60 * 1000;
    expect(EPHEMERAL_SNAPSHOT_TTL_MS).toBeGreaterThanOrEqual(day);
    for (const persistent of [true, false]) {
      expect(
        vercelSnapshotCreateOptions(persistent).snapshotExpiration,
      ).toBeGreaterThanOrEqual(day);
    }
  });

  /**
   * Create-time policy only covers sandboxes created after it shipped, so both
   * stop paths re-apply it — the SDK stop and the stop-by-session-id fallback.
   */
  test("stop() applies retention before every stop request", () => {
    const body = methodBody(providerSource, "  async stop(): Promise<void> {");
    const stops = [
      ...body.matchAll(/await this\.(?:sandbox\.stop|stopSessionById)\(/g),
    ].map((match) => match.index);
    expect(stops.length, "stop paths moved or were renamed").toBeGreaterThan(0);
    let previousStopAt = 0;
    for (const stopAt of stops) {
      const retentionAt = body.lastIndexOf(
        "await this.ensureSnapshotRetention();",
        stopAt,
      );
      expect(
        retentionAt,
        `stop at index ${stopAt} shares no retention call of its own`,
      ).toBeGreaterThan(previousStopAt);
      previousStopAt = stopAt;
    }
  });

  test("createSnapshot() applies retention before capturing", () => {
    const body = methodBody(providerSource, "  async createSnapshot(");
    const retentionAt = body.indexOf("await this.ensureSnapshotRetention();");
    expect(
      retentionAt,
      "explicit captures no longer evict older snaps",
    ).toBeGreaterThan(-1);
    expect(retentionAt).toBeLessThan(body.indexOf("this.sandbox.snapshot({"));
  });

  test("retention is applied through the Vercel update API", () => {
    const body = methodBody(
      providerSource,
      "  private async ensureSnapshotRetention(): Promise<void> {",
    );
    expect(body).toContain(
      "this.sandbox.update({ keepLastSnapshots: KEEP_LAST_SNAPSHOTS })",
    );
  });
});

/**
 * Deleting a sandbox is documented to cascade to its snapshots, and does not:
 * ephemeral automation sandboxes left never-expiring snap_* objects billing
 * indefinitely (fix 888455d1).
 */
describe("deleting a sandbox purges its snapshots", () => {
  const body = methodBody(providerSource, "  async delete(options?: {");

  test("sweeps before and after the sandbox goes away", () => {
    const sweeps = [...body.matchAll(/deleteSnapshotsForSandbox\(/g)].map(
      (match) => match.index,
    );
    expect(
      sweeps.length,
      "the post-delete sweep is what catches the cascade failure",
    ).toBe(2);
    const sandboxDeleteAt = body.indexOf("await this.sandbox.delete()");
    expect(sandboxDeleteAt).toBeGreaterThan(sweeps[0]);
    expect(sandboxDeleteAt).toBeLessThan(sweeps[1]);
  });

  /** A failed sandbox delete must not skip the sweep that follows it. */
  test("still sweeps when the sandbox delete throws", () => {
    const sandboxDeleteAt = body.indexOf("await this.sandbox.delete()");
    const catchAt = body.indexOf("} catch (error) {", sandboxDeleteAt);
    expect(catchAt, "sandbox.delete() is no longer guarded").toBeGreaterThan(
      sandboxDeleteAt,
    );
    expect(body.indexOf("deleteSnapshotsForSandbox(", catchAt)).toBeGreaterThan(
      catchAt,
    );
  });

  /** Seed captures are shared across sandbox lineages — deleting one breaks the rest. */
  test("honours the caller's preserve list and re-hydrates before deleting", () => {
    const sweep = methodBody(
      providerSource,
      "  private async deleteSnapshotsForSandbox(",
    );
    expect(sweep).toContain("if (preserveSnapshotIds.has(meta.id)) continue;");
    const getAt = sweep.indexOf("await Snapshot.get({");
    expect(getAt, "Snapshot.get moved or was renamed").toBeGreaterThan(-1);
    expect(getAt).toBeLessThan(sweep.indexOf("await snap.delete()"));
  });
});

/**
 * One Convex definition, from `export const <name> = …({` to the `\n});` that
 * closes it. Ending on the closing brace matters: slicing to the next `export`
 * would swallow the un-exported helpers that sit between definitions.
 */
function definitionBody(source: string, name: string): string {
  const startAt = source.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n});", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

/**
 * One class method, from its declaration to the next method's declaration.
 *
 * Ends on the next declaration rather than on a closing brace: a method whose
 * signature spans lines (`delete(options?: {…})`) closes a brace at method
 * indentation before its body even starts.
 */
const NEXT_METHOD = /\n {2}(?:private |protected |public )?(?:async )?\w+[(<:]/;

/** One class declaration, from its `class <name>` line to the next top-level one. */
function classBody(source: string, name: string): string {
  const startAt = source.indexOf(`class ${name} `);
  expect(startAt, `class ${name} moved or was renamed`).toBeGreaterThan(-1);
  const nextAt = source.indexOf("\nclass ", startAt);
  return source.slice(startAt, nextAt < 0 ? undefined : nextAt);
}

function methodBody(source: string, declaration: string): string {
  const startAt = source.indexOf(declaration);
  expect(startAt, `${declaration.trim()} moved or was renamed`).toBeGreaterThan(
    -1,
  );
  const rest = source.slice(startAt + declaration.length);
  const nextAt = rest.search(NEXT_METHOD);
  return declaration + (nextAt < 0 ? rest : rest.slice(0, nextAt));
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
