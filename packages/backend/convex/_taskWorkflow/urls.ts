const EVA_BASE_URL = "https://eva-web-git-staging-evalucom.vercel.app";

/** Builds a link to view a task in the Eva web app. */
export function buildEvaTaskUrl(
  repoOwner: string,
  repoName: string,
  taskId: string,
  projectId?: string,
): string {
  if (projectId) {
    return `${EVA_BASE_URL}/${repoOwner}/${repoName}/projects/${projectId}`;
  }
  return `${EVA_BASE_URL}/${repoOwner}/${repoName}/quick-tasks/${taskId}`;
}

/** Builds a link to view a session in the Eva web app. */
export function buildEvaSessionUrl(
  repoOwner: string,
  repoName: string,
  sessionId: string,
): string {
  return `${EVA_BASE_URL}/${repoOwner}/${repoName}/sessions/${sessionId}`;
}
