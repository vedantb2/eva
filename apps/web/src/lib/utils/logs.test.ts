import { expect, test } from "vitest";
import { formatTokens, getTotalInputTokens, parseResultEvent } from "./logs";

test("parseResultEvent keeps input vs cache token categories separate", () => {
  // Cost UI must not treat cache reads as billed input tokens.
  const event = parseResultEvent(
    JSON.stringify({
      total_cost_usd: 1.25,
      provider: "anthropic",
      duration_ms: 1200,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_read_input_tokens: 1000,
        cache_creation_input_tokens: 200,
      },
      modelUsage: {
        "claude-sonnet": { costUSD: 1.25 },
        other: { costUSD: 0.1 },
      },
    }),
  );

  expect(event.inputTokens).toBe(100);
  expect(event.cacheReadTokens).toBe(1000);
  expect(event.cacheCreationTokens).toBe(200);
  expect(event.outputTokens).toBe(50);
  expect(event.model).toBe("claude-sonnet");
  expect(getTotalInputTokens(event)).toBe(1300);
});

test("parseResultEvent returns empty defaults for invalid JSON", () => {
  expect(parseResultEvent(undefined).inputTokens).toBe(0);
  expect(parseResultEvent("{").model).toBe("-");
});

test("formatTokens uses compact suffixes", () => {
  expect(formatTokens(0)).toBe("0");
  expect(formatTokens(1500)).toBe("1.5k");
  expect(formatTokens(2_000_000)).toBe("2.0M");
});
