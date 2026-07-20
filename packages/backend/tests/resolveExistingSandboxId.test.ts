import { expect, test } from "vitest";
import {
  preferPersistedSandboxId,
  resolveExistingSandboxId,
  resolveReusableVercelSandboxId,
} from "../convex/_sandbox/resolveExistingSandboxId";

test("resolveExistingSandboxId prefers vercelSandboxId on vercel", () => {
  expect(
    resolveExistingSandboxId({
      providerKind: "vercel",
      sandboxId: "legacy-or-daytona",
      vercelSandboxId: "sb_vercel_name",
    }),
  ).toBe("sb_vercel_name");
});

test("resolveExistingSandboxId falls back to sandboxId when vercel field missing", () => {
  // Legacy rows only persisted the Vercel name on sandboxId — without this,
  // resume skips reuse and creates a second sandbox.
  expect(
    resolveExistingSandboxId({
      providerKind: "vercel",
      sandboxId: "sb_legacy_name",
      vercelSandboxId: undefined,
    }),
  ).toBe("sb_legacy_name");
});

test("resolveExistingSandboxId uses sandboxId on daytona", () => {
  expect(
    resolveExistingSandboxId({
      providerKind: "daytona",
      sandboxId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      vercelSandboxId: "sb_should_ignore",
    }),
  ).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
});

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
