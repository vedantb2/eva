import { expect, test } from "vitest";
import { aggregateContextUsage } from "./contextUsage";

function cursorResult(args: {
  sessionId: string;
  inputTokens?: number;
  outputTokens?: number;
  contextUsedTokens?: number;
  contextWindowSize?: number;
  usageAvailable?: boolean;
}): string {
  return JSON.stringify({
    provider: "cursor",
    usage_scope: "session",
    usage_available: args.usageAvailable ?? true,
    acp_session_id: args.sessionId,
    usage: {
      input_tokens: args.inputTokens ?? 0,
      output_tokens: args.outputTokens ?? 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
    context_used_tokens: args.contextUsedTokens,
    context_window_size: args.contextWindowSize,
    modelUsage: { "cursor-model": {} },
  });
}

function turnResult(args: {
  provider?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}): string {
  return JSON.stringify({
    provider: args.provider,
    usage: {
      input_tokens: args.inputTokens,
      output_tokens: args.outputTokens,
      cache_read_input_tokens: args.cacheReadTokens ?? 0,
      cache_creation_input_tokens: args.cacheCreationTokens ?? 0,
    },
    modelUsage: { [args.model]: {} },
  });
}

test("aggregateContextUsage counts cumulative Cursor totals once per ACP session", () => {
  const aggregated = aggregateContextUsage([
    {
      rawResultEvent: cursorResult({
        sessionId: "cursor-session",
        inputTokens: 200,
        outputTokens: 50,
        contextUsedTokens: 125,
        contextWindowSize: 1000,
      }),
    },
    {
      rawResultEvent: cursorResult({
        sessionId: "cursor-session",
        inputTokens: 100,
        outputTokens: 20,
      }),
    },
  ]);

  expect(aggregated?.usage.inputTokens).toBe(200);
  expect(aggregated?.usage.outputTokens).toBe(50);
  expect(aggregated?.usedTokens).toBe(125);
  expect(aggregated?.maxTokens).toBe(1000);
  expect(aggregated?.reporting).toEqual({ status: "complete" });
});

test("aggregateContextUsage marks current Cursor context as unavailable", () => {
  const aggregated = aggregateContextUsage([
    {
      rawResultEvent: cursorResult({
        sessionId: "cursor-session",
        usageAvailable: false,
      }),
    },
  ]);

  expect(aggregated?.reporting).toEqual({
    status: "unavailable",
    provider: "Cursor",
  });
  expect(aggregated?.usedTokens).toBe(0);
});

test("aggregateContextUsage keeps Cursor token totals visible without exact occupancy", () => {
  const aggregated = aggregateContextUsage([
    {
      rawResultEvent: cursorResult({
        sessionId: "cursor-session",
        inputTokens: 200,
        outputTokens: 50,
      }),
    },
  ]);

  expect(aggregated?.usedTokens).toBe(250);
  expect(aggregated?.reporting).toEqual({
    status: "partial",
    providers: ["Cursor"],
  });
});

test.each([
  ["claude", "claude-sonnet-4-20250514"],
  ["codex", "gpt-5.5"],
  ["opencode", "openai/gpt-5.4"],
])("aggregateContextUsage supports %s turn usage", (provider, model) => {
  const aggregated = aggregateContextUsage([
    {
      rawResultEvent: turnResult({
        provider,
        model,
        inputTokens: 100,
        outputTokens: 25,
        cacheReadTokens: 300,
        cacheCreationTokens: 50,
      }),
    },
  ]);

  expect(aggregated?.usedTokens).toBe(475);
  expect(aggregated?.usage).toEqual({
    inputTokens: 100,
    outputTokens: 25,
    cachedInputReadTokens: 300,
    cachedInputWriteTokens: 50,
  });
  expect(aggregated?.reporting).toEqual({ status: "complete" });
});

test("aggregateContextUsage does not let an older Cursor log hide historical Claude usage", () => {
  const aggregated = aggregateContextUsage([
    {
      // Historical Claude logs have model/usage data but no provider field.
      rawResultEvent: turnResult({
        model: "claude-sonnet-4-20250514",
        inputTokens: 120,
        outputTokens: 30,
      }),
    },
    {
      rawResultEvent: cursorResult({
        sessionId: "older-cursor-session",
        usageAvailable: false,
      }),
    },
  ]);

  expect(aggregated?.usedTokens).toBe(150);
  expect(aggregated?.reporting).toEqual({
    status: "partial",
    providers: ["Cursor"],
  });
});
