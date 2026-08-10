import { expect, test } from "vitest";
import { buildCodexRuntimeConfig } from "../session/codexSession.js";

test("Codex Fast mode is explicit and defaults to Standard", () => {
  const configured = 'service_tier = "fast"\nmodel_verbosity = "low"';

  expect(buildCodexRuntimeConfig(configured, "", false)).not.toContain(
    "service_tier",
  );
  expect(buildCodexRuntimeConfig(configured, "", false)).toContain(
    'model_verbosity = "low"',
  );
  expect(buildCodexRuntimeConfig(configured, "", true)).toContain(
    'service_tier = "fast"',
  );
});
