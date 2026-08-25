import { describe, expect, test } from "vitest";
import { isSandboxUnresumableMessage } from "../convex/_sandbox_runtime/helpers";

/**
 * Reuse falls through to a replacement sandbox when this returns true. A
 * Postgres schema error on resume used to match (bare "does not exist") and
 * mint a second VM while the first was still running.
 */
describe("isSandboxUnresumableMessage", () => {
  test("a SQL relation error is not a gone sandbox", () => {
    expect(
      isSandboxUnresumableMessage(
        'Sandbox command failed (exit 1): ERROR: relation "public.CqcDiscoveryCandidate" does not exist',
      ),
    ).toBe(false);
  });

  test("a missing binary inside the VM is not a gone sandbox", () => {
    expect(
      isSandboxUnresumableMessage(
        "Sandbox command failed (exit 127): bash: jq: command not found",
      ),
    ).toBe(false);
  });

  test("a start timeout is not a gone sandbox", () => {
    expect(
      isSandboxUnresumableMessage(
        "vercel start: sandbox crimson-temporary-butterfly-GwSNaL did not reach running within 180s (state: starting)",
      ),
    ).toBe(false);
  });

  test("Vercel get of a missing sandbox is gone", () => {
    expect(isSandboxUnresumableMessage("Status code 404 is not ok")).toBe(
      true,
    );
  });

  test("refresh wrapping a missing sandbox is gone", () => {
    expect(
      isSandboxUnresumableMessage(
        "sandbox gone on refresh: Status code 404 is not ok",
      ),
    ).toBe(true);
  });

  test("an unresumable handle state is gone", () => {
    expect(
      isSandboxUnresumableMessage("sandbox unresumable state: gone"),
    ).toBe(true);
  });

  test("a missing snapshot is gone", () => {
    expect(isSandboxUnresumableMessage("snapshot_not_found")).toBe(true);
    expect(isSandboxUnresumableMessage("invalid_snapshot")).toBe(true);
    expect(
      isSandboxUnresumableMessage("snapshot abc does not exist"),
    ).toBe(true);
  });
});
