import type { ExtractedContext, RepoInfo } from "@/shared/types";
import { getToken } from "./auth";
import { CONDUCTOR_URL } from "@/shared/messaging";

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  return fetch(`${CONDUCTOR_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

export async function fetchRepos(): Promise<RepoInfo[]> {
  const response = await fetchWithAuth("/api/extension/repos");

  if (!response.ok) {
    throw new Error(`Failed to fetch repos: ${response.status}`);
  }

  const data = await response.json();
  return data.repos || [];
}

export async function createTask(params: {
  repoId: string;
  title: string;
  description: string;
  extensionContext: ExtractedContext | null;
  sourceUrl: string;
}): Promise<{ taskId: string }> {
  const response = await fetchWithAuth("/api/extension/task", {
    method: "POST",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create task: ${error}`);
  }

  return response.json();
}
