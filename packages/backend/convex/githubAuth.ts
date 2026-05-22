"use node";

import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import {
  ensurePkcs8PrivateKey,
  normalizePemKey,
} from "./githubPrivateKeyFormat";

export { normalizePemKey } from "./githubPrivateKeyFormat";

/** Builds an authenticated GitHub clone URL using an access token. */
export function buildGitHubRepoUrl(
  owner: string,
  repo: string,
  token: string,
): string {
  return `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
}

/** Builds a base64-encoded authorization header for git HTTP operations. */
export function buildGitHubExtraHeader(token: string): string {
  return `AUTHORIZATION: basic ${Buffer.from(
    `x-access-token:${token}`,
  ).toString("base64")}`;
}

/** Reads GitHub App credentials from environment variables. */
export function getGitHubCredentials() {
  const appId = process.env.GITHUB_APP_ID;
  const rawKey = process.env.GITHUB_PRIVATE_KEY;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!appId || !rawKey) {
    throw new Error("GitHub App credentials not configured");
  }
  return {
    appId,
    privateKey: ensurePkcs8PrivateKey(normalizePemKey(rawKey)),
    clientId: clientId ?? "",
    clientSecret: clientSecret ?? "",
  };
}

/** Generates a short-lived access token for a GitHub App installation. */
export async function getInstallationToken(
  installationId: number,
): Promise<string> {
  const creds = getGitHubCredentials();
  const auth = createAppAuth(creds);
  const installationAuth = await auth({
    type: "installation",
    installationId,
  });
  return installationAuth.token;
}

/** Creates an Octokit client authenticated as a specific GitHub App installation. */
export async function getInstallationOctokit(
  installationId: number,
): Promise<Octokit> {
  const creds = getGitHubCredentials();
  const auth = createAppAuth(creds);
  const installationAuth = await auth({
    type: "installation",
    installationId,
  });
  return new Octokit({ auth: installationAuth.token });
}

/** Creates an Octokit client authenticated as the GitHub App itself (not an installation). */
export function getAppOctokit(): Octokit {
  const creds = getGitHubCredentials();
  return new Octokit({
    authStrategy: createAppAuth,
    auth: creds,
  });
}

/** Internal action wrapper so HTTP actions can mint an installation token via ctx.runAction. */
export const mintInstallationToken = internalAction({
  args: { installationId: v.number() },
  returns: v.string(),
  handler: async (_ctx, args) => {
    return await getInstallationToken(args.installationId);
  },
});
