import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

/**
 * The seeded snapshot is an app's warm boot. The chain used to delete the live
 * one *before* building its replacement, so any failure in a ~40-minute build
 * destroyed the only good snapshot too: the app lost warm boots, the next build
 * cold-started, and a degraded fleet turned one slow build into a run of
 * failures (fix 7dc5a8f7).
 *
 * Keep-last-good means the old snapshot keeps serving sandboxes until the
 * replacement is active, the pointer swaps, and only then is the old one
 * removed. Every rule below is one way that ordering can be lost.
 */
describe("a failed seeded build leaves the previous snapshot serving", () => {
  const region = seededBuildRegion();

  const previousAt = region.indexOf("const previousSeededSnapshotName =");
  const triggerAt = region.indexOf(
    "internal.snapshotActions.triggerSeededSnapshot",
  );
  const swapAt = region.indexOf("internal.repoSnapshots.setSeededSnapshotName");
  const previousDeleteAt = region.indexOf(
    "snapshotName: previousSeededSnapshotName",
  );

  test("the region under test was found", () => {
    expect(previousAt, "the previous-snapshot read moved").toBeGreaterThan(-1);
    expect(triggerAt, "the capture trigger moved").toBeGreaterThan(-1);
    expect(swapAt, "the pointer swap moved").toBeGreaterThan(-1);
    expect(
      previousDeleteAt,
      "the previous-snapshot delete moved",
    ).toBeGreaterThan(-1);
  });

  /** Read before the capture, or the name is gone by the time cleanup needs it. */
  test("the previous snapshot name is captured before the new one is built", () => {
    expect(previousAt).toBeLessThan(triggerAt);
  });

  /**
   * The whole fix in one assertion: the old snapshot is deleted only after the
   * app already points at the new one. Reversed, a failure between the two
   * leaves the app pointing at nothing.
   */
  test("the previous snapshot is deleted only after the pointer swaps", () => {
    expect(
      previousDeleteAt,
      "the previous snapshot is deleted before the swap — a failure in between loses both",
    ).toBeGreaterThan(swapAt);
  });

  /**
   * Both early-return failure paths delete a snapshot, and both must delete the
   * *new* partial capture rather than the live one.
   */
  test("no failure path deletes the previous snapshot", () => {
    const beforeSwap = region.slice(0, swapAt);
    expect(
      beforeSwap,
      "a failure path deletes the previous snapshot",
    ).not.toContain("snapshotName: previousSeededSnapshotName");
    expect(
      beforeSwap,
      "the failure paths no longer clean up the partial capture",
    ).toContain("snapshotName: effectiveSeededName");
  });

  /**
   * `failBuild` marks the *build* as fallback with `seededSnapshotName: null`.
   * That null belongs to the build record only — writing it to the repo would
   * clear the live pointer, which is the same outage by another route.
   */
  test("failing a build does not clear the app's live pointer", () => {
    const failBuild = sliceFrom(region, "const failBuild = async (");
    expect(failBuild, "failBuild moved or was renamed").not.toBe("");
    expect(
      failBuild,
      "failBuild writes the repo's seeded pointer",
    ).not.toContain("setSeededSnapshotName");
  });

  /**
   * Deleting the prep sandbox on the success path happens *after* the capture,
   * and Vercel's sandbox delete does not reliably stop at the sandbox — without
   * an explicit preserve the brand-new snapshot goes with it.
   */
  test("the success-path sandbox delete preserves the new snapshot", () => {
    const deleteAt = region.lastIndexOf(
      "internal.snapshotActions.deleteSeedPrepSandbox",
      swapAt,
    );
    expect(deleteAt, "the success-path sandbox delete moved").toBeGreaterThan(
      -1,
    );
    expect(
      region.slice(deleteAt, swapAt),
      "the prep sandbox is deleted without preserving the new snapshot",
    ).toContain("preserveSnapshotId: effectiveSeededName");
  });

  /**
   * A stray old snapshot costs storage; a thrown cleanup turns an already
   * successful build into a reported failure. The next successful build removes
   * whatever this leaves behind.
   */
  test("the previous-snapshot delete is best-effort", () => {
    const tail = region.slice(swapAt);
    const deleteAt = tail.indexOf("snapshotName: previousSeededSnapshotName");
    expect(tail.lastIndexOf("try {", deleteAt)).toBeGreaterThan(-1);
    expect(tail.indexOf("catch", deleteAt)).toBeGreaterThan(-1);
  });
});

/**
 * The requested name and the provider's actual id are two different strings on
 * Vercel: `triggerSeededSnapshot` asks for `seeded-<repoId>` and gets back a
 * generated `snap_*`. Polling or storing the requested name instead would wait
 * on a snapshot that does not exist under that id, so the build times out and
 * falls back — with the real capture left orphaned.
 */
describe("everything after the capture uses the provider's returned id", () => {
  const region = seededBuildRegion();
  const afterTrigger = region.slice(region.indexOf("let snapState"));

  test("the post-capture region was found", () => {
    expect(afterTrigger).toContain("pollSeededSnapshotState");
    expect(afterTrigger).toContain("effectiveSeededName");
  });

  test("the requested name is never passed as a value again", () => {
    expect(afterTrigger, "a step still passes the requested name").not.toMatch(
      /:\s*seededName\b/,
    );
    expect(
      afterTrigger,
      "a step passes the requested name by shorthand",
    ).not.toMatch(/\bseededName\s*[,}]/);
  });
});

/**
 * The capture poll has to outlast a degraded fleet, which is what blew the
 * original window: a capture still running when the polls ran out was treated
 * as a failure and thrown away. Dropping this back to ~20 minutes reintroduces
 * that.
 */
describe("the capture poll window", () => {
  const source = readSource("snapshotWorkflow.ts");

  test("allows at least 45 minutes for a capture", () => {
    const polls = numericConstant(source, "MAX_SEED_SNAPSHOT_POLLS");
    const delayMs = numericConstant(source, "SEED_SNAPSHOT_POLL_DELAY_MS");
    expect((polls * delayMs) / 60_000).toBeGreaterThanOrEqual(45);
  });
});

/** Reads a `const NAME = 12_345;` numeric literal out of the source. */
function numericConstant(source: string, name: string): number {
  const match = new RegExp(`const ${name} = ([0-9_]+)`).exec(source);
  expect(match, `${name} moved or was renamed`).not.toBe(null);
  return Number((match?.[1] ?? "0").replaceAll("_", ""));
}

/**
 * The per-app seeding half of the build workflow: everything from the point the
 * seeded name is derived to the end of the handler. Sliced rather than read
 * whole because the file's earlier half rebuilds the base image, which has its
 * own unrelated snapshot deletes.
 */
function seededBuildRegion(): string {
  const source = readSource("snapshotWorkflow.ts");
  const startAt = source.indexOf("const seededName = ");
  expect(startAt, "the seeded-name derivation moved").toBeGreaterThan(-1);
  return source.slice(startAt);
}

/** From a declaration to the blank line that follows its closing brace. */
function sliceFrom(source: string, declaration: string): string {
  const startAt = source.indexOf(declaration);
  if (startAt < 0) return "";
  const rest = source.slice(startAt);
  const endAt = rest.indexOf("\n    };");
  return endAt < 0 ? rest : rest.slice(0, endAt);
}

/** Comments name the very calls these rules rule out, so they have to go first. */
function readSource(relativePath: string): string {
  return stripComments(
    readFileSync(join(convexDir, relativePath), "utf8").replaceAll(
      "\r\n",
      "\n",
    ),
  );
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
