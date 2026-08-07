import { expect, test } from "vitest";
import {
  AI_MODEL_OPTIONS,
  assertModelMatchesLockedProvider,
  getLockedProviderModelOptions,
} from "../convex/_validators/aiModels";

test("a pinned session only offers its own provider's models", () => {
  const claudeOnly = getLockedProviderModelOptions(AI_MODEL_OPTIONS, "claude");
  expect(claudeOnly.length).toBeGreaterThan(0);
  expect(claudeOnly.every((option) => option.provider === "claude")).toBe(true);
  expect(claudeOnly.length).toBeLessThan(AI_MODEL_OPTIONS.length);
});

test("sessions created before the lock keep every visible model", () => {
  expect(getLockedProviderModelOptions(AI_MODEL_OPTIONS, undefined)).toEqual(
    AI_MODEL_OPTIONS,
  );
  expect(getLockedProviderModelOptions(AI_MODEL_OPTIONS, null)).toEqual(
    AI_MODEL_OPTIONS,
  );
});

test("the model write guard rejects a cross-provider switch", () => {
  // The reported bug: a Claude session switched to Grok, stranding the owner's
  // Claude account.
  expect(() =>
    assertModelMatchesLockedProvider("claude", "cursor:grok-4.5"),
  ).toThrow(/runs on claude/);
  expect(() =>
    assertModelMatchesLockedProvider("claude", "claude:opus"),
  ).not.toThrow();
  // No lock recorded (legacy session) — anything goes, as before.
  expect(() =>
    assertModelMatchesLockedProvider(undefined, "cursor:grok-4.5"),
  ).not.toThrow();
});
