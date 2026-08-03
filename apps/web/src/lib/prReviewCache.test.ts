import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSwrCache } from "./prReviewCache";

/** STALE_MS from prReviewCache.ts — the cache module keeps it private. */
const STALE_MS = 30_000;

describe("createSwrCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("dedupes two concurrent loads for the same key into a single run", async () => {
    const cache = createSwrCache<string>();
    let runs = 0;
    const run = () => {
      runs += 1;
      return Promise.resolve("value");
    };

    const [first, second] = await Promise.all([
      cache.fetch("key", run, false),
      cache.fetch("key", run, false),
    ]);

    expect(runs).toBe(1);
    expect(first).toBe("value");
    expect(second).toBe("value");
  });

  test("does not re-run within STALE_MS, and peek reports the entry as not stale", async () => {
    // `fetch` itself has no staleness gate — only concurrent calls for the same
    // key dedupe (see the test above). Staleness gating is the caller's job:
    // check `peek` first and only call `fetch` again when it reports stale, the
    // same pattern usePrOverview.ts follows. This test models that contract.
    const cache = createSwrCache<string>();
    let runs = 0;
    const run = () => {
      runs += 1;
      return Promise.resolve("v1");
    };
    await cache.fetch("key", run, false);

    vi.setSystemTime(STALE_MS - 1);
    const peeked = cache.peek("key");
    expect(peeked).toEqual({ value: "v1", stale: false });
    if (peeked?.stale) {
      await cache.fetch("key", run, false);
    }

    expect(runs).toBe(1);
  });

  test("peek reports the entry stale once STALE_MS has elapsed", async () => {
    const cache = createSwrCache<string>();
    await cache.fetch("key", () => Promise.resolve("v1"), false);

    vi.setSystemTime(STALE_MS + 1);

    expect(cache.peek("key")).toEqual({ value: "v1", stale: true });
  });

  test("force re-runs even when a fresh entry already exists", async () => {
    const cache = createSwrCache<string>();
    let runs = 0;
    await cache.fetch(
      "key",
      () => {
        runs += 1;
        return Promise.resolve("v1");
      },
      false,
    );

    const forced = await cache.fetch(
      "key",
      () => {
        runs += 1;
        return Promise.resolve("v2");
      },
      true,
    );

    expect(runs).toBe(2);
    expect(forced).toBe("v2");
    expect(cache.peek("key")?.value).toBe("v2");
  });

  test("a rejected load clears the in-flight entry so the next load retries", async () => {
    const cache = createSwrCache<string>();
    let runs = 0;

    await expect(
      cache.fetch(
        "key",
        () => {
          runs += 1;
          return Promise.reject(new Error("boom"));
        },
        false,
      ),
    ).rejects.toThrow("boom");

    const retried = await cache.fetch(
      "key",
      () => {
        runs += 1;
        return Promise.resolve("v1");
      },
      false,
    );

    expect(runs).toBe(2);
    expect(retried).toBe("v1");
  });
});
