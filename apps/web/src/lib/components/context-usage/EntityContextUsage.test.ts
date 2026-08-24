import { expect, test } from "vitest";
import { aggregateUsage } from "./EntityContextUsage";

test("aggregateUsage uses latest occupancy, not summed cache reads", () => {
  const logs = [
    {
      rawResultEvent: JSON.stringify({
        total_cost_usd: 18.19,
        provider: "claude",
        duration_ms: 1000,
        usage: {
          input_tokens: 10,
          output_tokens: 762,
          cache_read_input_tokens: 1_316_586,
          cache_creation_input_tokens: 4650,
          iterations: [
            {
              input_tokens: 2,
              output_tokens: 78,
              cache_read_input_tokens: 264_662,
              cache_creation_input_tokens: 480,
            },
          ],
        },
        modelUsage: {
          "claude-opus-5": { costUSD: 18.19, contextWindow: 1_000_000 },
        },
      }),
    },
    {
      rawResultEvent: JSON.stringify({
        total_cost_usd: 17.47,
        provider: "claude",
        duration_ms: 1000,
        usage: {
          input_tokens: 174,
          output_tokens: 26911,
          cache_read_input_tokens: 18_332_074,
          cache_creation_input_tokens: 90464,
        },
        modelUsage: {
          "claude-opus-5": { costUSD: 17.47, contextWindow: 1_000_000 },
        },
      }),
    },
  ];

  const aggregated = aggregateUsage(logs);
  expect(aggregated).not.toBeNull();
  if (aggregated === null) return;
  expect(aggregated.usedTokens).toBe(2 + 78 + 264_662 + 480);
  expect(aggregated.maxTokens).toBe(1_000_000);
  expect(aggregated.costs.totalUSD).toBeCloseTo(35.66);
  expect(aggregated.usedTokens / aggregated.maxTokens).toBeLessThan(1);
});
