import { expect, test } from "vitest";
import { isChunkLoadError } from "./isChunkLoadError";

test("isChunkLoadError detects ChunkLoadError name and common messages", () => {
  const named = new Error("boom");
  named.name = "ChunkLoadError";
  expect(isChunkLoadError(named)).toBe(true);

  expect(
    isChunkLoadError(
      new Error("Failed to fetch dynamically imported module: /assets/x.js"),
    ),
  ).toBe(true);
  expect(isChunkLoadError(new Error("Loading chunk 12 failed"))).toBe(true);
  expect(isChunkLoadError(new Error("Loading CSS chunk 3 failed"))).toBe(true);
  expect(isChunkLoadError(new Error("Importing a module script failed"))).toBe(
    true,
  );
});

test("isChunkLoadError rejects unrelated errors and non-errors", () => {
  expect(isChunkLoadError(new Error("Network timeout"))).toBe(false);
  expect(isChunkLoadError("string")).toBe(false);
  expect(isChunkLoadError(null)).toBe(false);
});
