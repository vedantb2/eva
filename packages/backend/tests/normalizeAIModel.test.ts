import { expect, test } from "vitest";
import {
  getAIModelProvider,
  normalizeAIModel,
} from "../convex/_validators/aiModels";

test("normalizeAIModel maps legacy cursor:composer-2 to composer-2.5", () => {
  // Existing sessions stored composer-2; without this they fail to load.
  expect(normalizeAIModel("cursor:composer-2")).toBe("cursor:composer-2.5");
  expect(normalizeAIModel("cursor:composer-2.5")).toBe("cursor:composer-2.5");
});

test("normalizeAIModel remaps retired cursor model ids", () => {
  expect(normalizeAIModel("cursor:gpt-5.3-codex-high")).toBe(
    "cursor:composer-2.5",
  );
  expect(normalizeAIModel("cursor:claude-4.6-sonnet-medium-thinking")).toBe(
    "cursor:grok-4.5-medium",
  );
});

test("normalizeAIModel upgrades bare legacy claude aliases", () => {
  expect(normalizeAIModel("opus")).toBe("claude:opus");
  expect(normalizeAIModel("haiku")).toBe("claude:haiku");
  expect(normalizeAIModel("sonnet")).toBe("claude:sonnet");
});

test("getAIModelProvider follows normalized model prefix", () => {
  expect(getAIModelProvider("cursor:composer-2")).toBe("cursor");
  expect(getAIModelProvider("opus")).toBe("claude");
  expect(getAIModelProvider("codex:gpt-5.4")).toBe("codex");
});
