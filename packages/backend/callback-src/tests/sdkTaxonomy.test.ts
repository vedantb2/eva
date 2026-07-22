import { test, expect, beforeEach } from "vitest";
import { callbackState as S, resetStateForTests } from "../runtime/state.js";
import {
  diffNewBackgroundTaskIds,
  parseClaudeSdkTaxonomy,
  resetSdkTaxonomyStateForTest,
} from "./sdkTaxonomy.js";
import { applyCanonicalEvents } from "./canonical.js";

beforeEach(() => {
  resetStateForTests();
  resetSdkTaxonomyStateForTest();
});

test("parseClaudeSdkTaxonomy maps compacting status and completes on next message", () => {
  applyCanonicalEvents(
    parseClaudeSdkTaxonomy({
      type: "system",
      subtype: "status",
      status: "compacting",
    }),
  );
  expect(S.accumulatedSteps).toHaveLength(1);
  expect(S.accumulatedSteps[0]).toMatchObject({
    type: "status",
    label: "Compacting context...",
    status: "active",
  });

  applyCanonicalEvents(
    parseClaudeSdkTaxonomy({
      type: "system",
      subtype: "compact_boundary",
    }),
  );
  expect(S.accumulatedSteps[0]?.status).toBe("complete");
  expect(S.accumulatedSteps[1]).toMatchObject({
    type: "notice",
    label: "Context compacted",
    status: "complete",
  });
});

test("parseClaudeSdkTaxonomy patches tool progress onto active step", () => {
  S.accumulatedSteps.push({
    type: "tool",
    label: "Running command...",
    toolUseId: "tool-1",
    status: "active",
  });
  applyCanonicalEvents(
    parseClaudeSdkTaxonomy({
      type: "tool_progress",
      tool_use_id: "tool-1",
      elapsed_time_seconds: 12.4,
    }),
  );
  expect(S.accumulatedSteps[0]?.detail).toBe("12s elapsed");
});

test("diffNewBackgroundTaskIds returns only unseen task ids", () => {
  expect(diffNewBackgroundTaskIds(["a", "b"])).toEqual(["a", "b"]);
  expect(diffNewBackgroundTaskIds(["b", "c"])).toEqual(["c"]);
});
