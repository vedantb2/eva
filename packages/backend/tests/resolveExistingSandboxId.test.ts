import { expect, test } from "vitest";
import {
  preferPersistedSandboxId,
  resolveReusableVercelSandboxId,
} from "../convex/_sandbox/resolveExistingSandboxId";

test("preferPersistedSandboxId prefers vercelSandboxId when present", () => {
  expect(
    preferPersistedSandboxId({
      sandboxId: "daytona-or-legacy",
      vercelSandboxId: "sb_name",
    }),
  ).toBe("sb_name");
  expect(
    preferPersistedSandboxId({
      sandboxId: "only-id",
      vercelSandboxId: undefined,
    }),
  ).toBe("only-id");
});

test("resolveReusableVercelSandboxId ignores Daytona UUID sandboxId fallback", () => {
  expect(
    resolveReusableVercelSandboxId({
      sandboxId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      vercelSandboxId: undefined,
    }),
  ).toBeUndefined();
  expect(
    resolveReusableVercelSandboxId({
      sandboxId: "sb_vercel_name",
      vercelSandboxId: undefined,
    }),
  ).toBe("sb_vercel_name");
  expect(
    resolveReusableVercelSandboxId({
      sandboxId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      vercelSandboxId: "sb_vercel_name",
    }),
  ).toBe("sb_vercel_name");
});
