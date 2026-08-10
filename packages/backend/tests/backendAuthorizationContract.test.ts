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

  // A client-supplied installation id can be any number GitHub ever issued, so
  // installations Eva has no row for must be proven against the caller's own
  // GitHub token rather than an installation token (which authenticates as the
  // App, across every installation it belongs to).
  it("unclaimed installations are verified with the caller's GitHub token", () => {
    const api = convexSource("_github/api.ts");
    expect(api).toContain("listInstallationReposForUser");
    expect(api).toContain("assertUserCanUseRepo");
    const userAuth = convexSource("_github/userAuth.ts");
    expect(userAuth).toContain("listInstallationReposForAuthenticatedUser");
    expect(userAuth).not.toContain("getInstallationOctokit");
  });

  it("connectRepo verifies GitHub access before binding a repo row", () => {
    const api = convexSource("_github/api.ts");
    const connect = api.slice(api.indexOf("export const connectRepo"));
    expect(connect.indexOf("assertUserCanUseRepo")).toBeLessThan(
      connect.indexOf("createForInstallation"),
    );
  });

  it("the repo create mutation refuses installations Eva does not know", () => {
    const mutations = convexSource("_githubRepos/mutations.ts");
    expect(mutations).toContain(
      "if (!installationRepos.some((repo) => repo.connectedBy === ctx.userId))",
    );
  });

  // GitHub answers OAuth failures with HTTP 200 and an error body, so a
  // hand-rolled fetch reads a failure as a success unless it parses for that.
  // Octokit already handles it; keep the exchange there.
  it("the OAuth token exchange goes through Octokit, not a raw fetch", () => {
    const userAuth = convexSource("_github/userAuth.ts");
    expect(userAuth).toContain("createToken");
    expect(userAuth).not.toContain("login/oauth/access_token");
  });

  it("GitHub user tokens stay server-side and are stored encrypted", () => {
    const tokens = convexSource("_github/userTokens.ts");
    expect(tokens).toContain("export const getStoredToken = internalQuery");
    expect(tokens).toContain("export const putStoredToken = internalMutation");
    const userAuth = convexSource("_github/userAuth.ts");
    expect(userAuth).toContain("encryptValue(token.accessToken)");
  });

  it("authorize-hop nonces are single-use", () => {
    const tokens = convexSource("_github/userTokens.ts");
    const consume = tokens.slice(
      tokens.indexOf("export const consumeOauthState"),
    );
    // Deleting before the expiry check is what makes a replay fail.
    expect(consume.indexOf("ctx.db.delete(row._id)")).toBeLessThan(
      consume.indexOf("row.expiresAt < Date.now()"),
    );
  });

  it("the GitHub OAuth callback identifies the user from the nonce alone", () => {
    const http = convexSource("http.ts");
    const callback = http.slice(
      http.indexOf('path: "/api/github/oauth/callback"'),
    );
    expect(callback).toContain("consumeOauthState");
    expect(callback).toContain("userId: claim.userId");
  });

  it("OAuth token exchange binds authorization codes to clients and S256", () => {
    const native = convexSource("mcp/native.ts");
    expect(native).toContain("entry.clientId !== params.client_id");
    expect(native).toContain('entry.codeChallengeMethod !== "S256"');
  });
});
