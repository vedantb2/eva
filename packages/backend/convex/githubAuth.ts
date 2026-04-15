"use node";

import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

/** Normalizes a PEM private key string by fixing line breaks and formatting. */
export function normalizePemKey(raw: string): string {
  const cleaned = raw.replace(/\\n/g, "\n").replace(/\\+$/gm, "").trim();
  if (cleaned.includes("\n")) return cleaned;

  const base64 = cleaned
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s/g, "");

  const isRsa = cleaned.includes("RSA PRIVATE KEY");
  const header = isRsa
    ? "-----BEGIN RSA PRIVATE KEY-----"
    : "-----BEGIN PRIVATE KEY-----";
  const footer = isRsa
    ? "-----END RSA PRIVATE KEY-----"
    : "-----END PRIVATE KEY-----";
  const lines: string[] = [header];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  lines.push(footer);
  return lines.join("\n");
}

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
    privateKey: normalizePemKey(rawKey),
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
