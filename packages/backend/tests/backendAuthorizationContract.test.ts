import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

function convexSource(path: string): string {
  return readFileSync(join(testsDir, "../convex", path), "utf8");
}

describe("backend authorization boundaries", () => {
  const repoGuardedActions = [
    "_github/prDiff.ts",
    "_github/prOverview.ts",
    "_github/prReview.ts",
    "_github/pullRequests.ts",
    "linearActions.ts",
    "pty.ts",
    "repoEnvVarsActions.ts",
    "taskWorkflowActions.ts",
  ];

  for (const path of repoGuardedActions) {
    it(`${path} resolves repository access before privileged work`, () => {
      expect(convexSource(path)).toContain("getActionRepoWithAccess");
    });
  }

  it("sandbox service actions require both repo access and sandbox binding", () => {
    expect(convexSource("_sandbox_runtime/services.ts")).toContain(
      "assertActionSandboxAccess",
    );
    expect(convexSource("_sandbox_runtime/execution.ts")).toContain(
      "assertActionSandboxAccess",
    );
  });

  it("OAuth token exchange binds authorization codes to clients and S256", () => {
    const native = convexSource("mcp/native.ts");
    expect(native).toContain("entry.clientId !== params.client_id");
    expect(native).toContain('entry.codeChallengeMethod !== "S256"');
  });
});
