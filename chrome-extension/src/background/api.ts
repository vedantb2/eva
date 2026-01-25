import type { ExtractedContext, RepoInfo, SessionInfo } from "@/shared/types";
import { CONDUCTOR_URL } from "@/shared/messaging";

function fetchWithAuth(
  token: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  return fetch(`${CONDUCTOR_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

export async function fetchRepos(token: string): Promise<RepoInfo[]> {
  const response = await fetchWithAuth(token, "/api/extension/repos");

  if (!response.ok) {
    throw new Error(`Failed to fetch repos: ${response.status}`);
  }

  const data = await response.json();
  return data.repos || [];
}

export async function createTask(
  token: string,
  params: {
    repoId: string;
    title: string;
    description: string;
    extensionContext: ExtractedContext | null;
    sourceUrl: string;
  }
): Promise<{ taskId: string }> {
  const response = await fetchWithAuth(token, "/api/extension/task", {
    method: "POST",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create task: ${error}`);
  }

  return response.json();
}

export async function getOrCreateSession(
  token: string,
  repoId: string
): Promise<SessionInfo> {
  const response = await fetchWithAuth(
    token,
    `/api/extension/session?repoId=${encodeURIComponent(repoId)}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get session: ${error}`);
  }

  return response.json();
}

export async function askQuestion(
  token: string,
  params: {
    sessionId: string;
    message: string;
  }
): Promise<void> {
  const response = await fetchWithAuth(token, "/api/sessions/execute", {
    method: "POST",
    body: JSON.stringify({
      sessionId: params.sessionId,
      message: params.message,
      mode: "ask",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to ask question: ${error}`);
  }
}
