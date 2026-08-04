import { describe, expect, test } from "vitest";
import {
  cursorComposerCapabilities,
  cursorModeIdForEva,
  cursorModelIdForEva,
  cursorReasoningLevelForEvaModel,
  evaModelIdForCursor,
  evaModelIdsForCursor,
  resolveCursorConfigUpdates,
  type CursorCapabilityConfigOption,
} from "../cursorCapabilities";

const configOptions: CursorCapabilityConfigOption[] = [
  {
    type: "select",
    id: "thought-level",
    name: "Reasoning",
    currentValue: "medium",
    options: [
      { value: "low", name: "Low" },
      { value: "medium", name: "Medium" },
      { value: "high", name: "High" },
    ],
  },
  {
    type: "boolean",
    id: "thinking",
    name: "Thinking",
    currentValue: true,
  },
  {
    type: "select",
    id: "context-window",
    name: "Context window",
    currentValue: "standard",
    options: [
      { value: "standard", name: "Standard" },
      { value: "extended-1m", name: "1M tokens" },
    ],
  },
];

describe("Cursor capability normalization", () => {
  test("maps Eva model ids to and from Cursor's advertised ids", () => {
    expect(cursorModelIdForEva("cursor:grok-4.5")).toBe("grok-4.5");
    expect(cursorModelIdForEva("cursor:grok-4.5-high")).toBe("grok-4.5");
    expect(evaModelIdForCursor("cursor-grok-4.5-high")).toBe("cursor:grok-4.5");
    expect(evaModelIdsForCursor("grok-4.5")).toEqual(["cursor:grok-4.5"]);
    expect(cursorReasoningLevelForEvaModel("cursor:grok-4.5-low")).toBe("low");
    expect(cursorReasoningLevelForEvaModel("cursor:grok-4.5")).toBeUndefined();
    expect(evaModelIdForCursor("gpt-5.5-low")).toBe("cursor:gpt-5.5-low");
  });

  test("derives composer controls from advertised configuration", () => {
    expect(cursorComposerCapabilities(configOptions)).toEqual([
      {
        kind: "select",
        id: "reasoningLevel",
        label: "Reasoning",
        description: "How much reasoning Cursor should use.",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
        defaultValue: "medium",
      },
      {
        kind: "boolean",
        id: "thinkingEnabled",
        label: "Thinking",
        description: "Allow Cursor's extended thinking mode.",
        defaultValue: true,
      },
      {
        kind: "boolean",
        id: "use1mContext",
        label: "Context window",
        description: "Use Cursor's extended context window.",
        defaultValue: false,
      },
    ]);
  });

  test("resolves every selected trait to the exact provider values", () => {
    expect(
      resolveCursorConfigUpdates(configOptions, {
        reasoningLevel: "high",
        thinkingEnabled: false,
        use1mContext: true,
      }),
    ).toEqual({
      updates: [
        { configId: "thought-level", value: "high" },
        { configId: "thinking", value: false },
        { configId: "context-window", value: "extended-1m" },
      ],
      unsupported: [],
    });
  });

  test("rejects controls and modes the provider did not advertise", () => {
    expect(
      resolveCursorConfigUpdates([], {
        reasoningLevel: "max",
        use1mContext: true,
      }).unsupported,
    ).toEqual(["reasoning level max", "1M context enabled"]);
    expect(
      cursorModeIdForEva("plan", [{ id: "agent", name: "Agent" }]),
    ).toEqual({ error: "Cursor ACP does not advertise Plan mode." });
    expect(
      cursorModeIdForEva("execute", [{ id: "agent", name: "Agent" }]),
    ).toEqual({ modeId: "agent" });
  });
});
