import { expect, test } from "vitest";
import {
  preferPersistedSandboxId,
  resolveReusableVercelSandboxId,
} from "../convex/_sandbox/resolveExistingSandboxId";

test("preferPersistedSandboxId returns sandboxId when set", () => {
  expect(
    preferPersistedSandboxId({
      sandboxId: "sb_name",
    }),
  ).toBe("sb_name");
  expect(
    preferPersistedSandboxId({
      sandboxId: undefined,
    }),
  ).toBeUndefined();
});

test("resolveReusableVercelSandboxId returns sandboxId", () => {
  expect(
    resolveReusableVercelSandboxId({
      sandboxId: "sb_vercel_name",
    }),
  ).toBe("sb_vercel_name");
  expect(
    resolveReusableVercelSandboxId({
      sandboxId: undefined,
    }),
  ).toBeUndefined();
});
