import { CONVEX_TOKEN, CONVEX_URL, REPO_ID } from "../config.js";
import { fetchWithTimeout } from "../http/convexClient.js";
import type { JsonObject, JsonValue } from "../types.js";
import { readResponseJson } from "../utils.js";

function readGithubToken(data: JsonValue | null): string | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const value = data.value;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const payload: JsonObject = value;
  return typeof payload.token === "string" ? payload.token : null;
}

/** Refreshes GitHub credentials before a warm chat provider starts. */
export async function ensureDaemonGithubToken(): Promise<void> {
  if (!REPO_ID || !CONVEX_URL || !CONVEX_TOKEN) return;
  try {
    const response = await fetchWithTimeout(CONVEX_URL + "/api/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + CONVEX_TOKEN,
      },
      body: JSON.stringify({
        path: "github:getInstallationTokenAction",
        args: { repoId: REPO_ID },
        format: "json",
      }),
    });
    if (!response.ok) return;
    const token = readGithubToken(await readResponseJson(response));
    if (!token) return;
    process.env.GITHUB_TOKEN = token;
    process.env.GH_TOKEN = token;
  } catch {
    // Git operations will report their own error if token minting stays down.
  }
}
