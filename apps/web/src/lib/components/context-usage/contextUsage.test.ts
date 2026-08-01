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
  expect(aggregated?.contextUnavailable).toBe(false);
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

  expect(aggregated?.partial).toBe(true);
  expect(aggregated?.contextUnavailable).toBe(true);
  expect(aggregated?.usedTokens).toBe(0);
});
