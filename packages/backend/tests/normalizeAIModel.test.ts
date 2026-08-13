import { expect, test } from "vitest";
import {
  buildTraitsExecutionPayload,
  getAIModelProvider,
  getModelTraits,
  modelHasTraits,
  normalizeAIModel,
  resolveTraitsForDisplay,
  storedTraitsFromRepoDefaults,
  usesChatDaemon,
} from "../convex/_validators/aiModels";

test("interactive Claude and Codex models use persistent chat daemons", () => {
  expect(usesChatDaemon("claude:sonnet")).toBe(true);
  expect(usesChatDaemon("codex:gpt-5.6-sol")).toBe(true);
  expect(usesChatDaemon("cursor:gpt-5.5")).toBe(false);
  expect(usesChatDaemon("opencode:openai/gpt-5.4")).toBe(false);
});

test("cursor base models expose reasoning traits for the composer menu", () => {
  expect(modelHasTraits("cursor:grok-4.6")).toBe(true);
  expect(getModelTraits("cursor:grok-4.6").reasoning).toEqual({
    levels: ["low", "medium", "high", "xhigh"],
    default: "high",
  });
  expect(getModelTraits("cursor:grok-4.6").fastMode).toBe(true);
  expect(modelHasTraits("cursor:grok-4.5")).toBe(true);
  expect(getModelTraits("cursor:grok-4.5").reasoning).toEqual({
    levels: ["low", "medium", "high"],
    default: "medium",
  });
  expect(getModelTraits("cursor:gpt-5.5").reasoning?.default).toBe("low");
  expect(getModelTraits("cursor:gpt-5.5").contextWindow1m).toBe(true);
  expect(getModelTraits("cursor:grok-4.5").fastMode).toBe(true);
  expect(modelHasTraits("cursor:composer-2.5")).toBe(true);
  expect(modelHasTraits("cursor:gemini-3.1-pro")).toBe(false);
});

test("Fast and 1M modes are opt-in", () => {
  expect(resolveTraitsForDisplay("cursor:grok-4.6", {})).toMatchObject({
    effortLevel: "high",
    fastMode: false,
    use1mContext: false,
  });
  expect(buildTraitsExecutionPayload("cursor:grok-4.6", {})).toMatchObject({
    fastMode: false,
  });
  expect(resolveTraitsForDisplay("cursor:grok-4.5", {})).toMatchObject({
    fastMode: false,
    use1mContext: false,
  });
  expect(buildTraitsExecutionPayload("cursor:grok-4.5", {})).toMatchObject({
    fastMode: false,
  });
  expect(
    buildTraitsExecutionPayload("cursor:grok-4.5", { fastMode: true }),
  ).toMatchObject({ fastMode: true });
  expect(buildTraitsExecutionPayload("cursor:gpt-5.5", {})).not.toHaveProperty(
    "use1mContext",
  );
});

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
    "cursor:grok-4.5",
  );
  expect(normalizeAIModel("cursor:gpt-5.5-high")).toBe("cursor:gpt-5.5");
  expect(normalizeAIModel("cursor:gpt-5.5-low")).toBe("cursor:gpt-5.5");
});

test("normalizeAIModel collapses reasoning-suffixed cursor ids to base models", () => {
  // Effort moved to the traits menu with the SDK migration; suffixed ids are
  // legacy persisted values.
  expect(normalizeAIModel("cursor:grok-4.6")).toBe("cursor:grok-4.6");
  expect(normalizeAIModel("cursor:grok-4.6-low")).toBe("cursor:grok-4.6");
  expect(normalizeAIModel("cursor:grok-4.6-high")).toBe("cursor:grok-4.6");
  expect(normalizeAIModel("cursor:grok-4.6-xhigh")).toBe("cursor:grok-4.6");
  expect(normalizeAIModel("cursor:grok-4.5-low")).toBe("cursor:grok-4.5");
  expect(normalizeAIModel("cursor:grok-4.5-medium")).toBe("cursor:grok-4.5");
  expect(normalizeAIModel("cursor:grok-4.5-high")).toBe("cursor:grok-4.5");
  expect(normalizeAIModel("cursor:grok-4.5")).toBe("cursor:grok-4.5");
  expect(normalizeAIModel("cursor:gpt-5.5")).toBe("cursor:gpt-5.5");
});

test("normalizeAIModel remaps retired Codex models to gpt-5.5", () => {
  expect(normalizeAIModel("codex:gpt-5.4")).toBe("codex:gpt-5.5");
  expect(normalizeAIModel("codex:gpt-5.4-mini")).toBe("codex:gpt-5.5");
  expect(normalizeAIModel("codex:gpt-5.3-codex")).toBe("codex:gpt-5.5");
  expect(normalizeAIModel("codex:gpt-5.2-codex")).toBe("codex:gpt-5.5");
  expect(normalizeAIModel("codex:gpt-5.5")).toBe("codex:gpt-5.5");
  expect(normalizeAIModel("codex:gpt-5.5-pro")).toBe("codex:gpt-5.5");
});

test("normalizeAIModel keeps GPT-5.6 Sol/Terra/Luna and aliases bare gpt-5.6 to Sol", () => {
  expect(normalizeAIModel("codex:gpt-5.6-sol")).toBe("codex:gpt-5.6-sol");
  expect(normalizeAIModel("codex:gpt-5.6-terra")).toBe("codex:gpt-5.6-terra");
  expect(normalizeAIModel("codex:gpt-5.6-luna")).toBe("codex:gpt-5.6-luna");
  expect(normalizeAIModel("codex:gpt-5.6")).toBe("codex:gpt-5.6-sol");
  expect(getModelTraits("codex:gpt-5.6-sol").reasoning?.levels).toContain(
    "max",
  );
  expect(getModelTraits("codex:gpt-5.5").reasoning?.levels).not.toContain(
    "max",
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

test("storedTraitsFromRepoDefaults maps repo config fields", () => {
  expect(
    storedTraitsFromRepoDefaults({
      defaultReasoningLevel: "xhigh",
      defaultFastMode: true,
    }),
  ).toEqual({
    effortLevel: "xhigh",
    thinkingEnabled: undefined,
    use1mContext: undefined,
    fastMode: true,
  });
});
