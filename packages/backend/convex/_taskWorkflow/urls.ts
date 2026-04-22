const EVA_BASE_URL = "https://eva-web-git-staging-evalucom.vercel.app";

function repoSegment(repoName: string, rootDirectory?: string): string {
  if (!rootDirectory) return repoName;
  const appName = rootDirectory.split("/").pop();
  if (!appName) return repoName;
  return `${repoName}--${appName}`;
}

/** Builds a link to view a task in the Eva web app. */
export function buildEvaTaskUrl(
  repoOwner: string,
  repoName: string,
  taskId: string,
  projectId?: string,
  rootDirectory?: string,
): string {
  const segment = repoSegment(repoName, rootDirectory);
  if (projectId) {
    return `${EVA_BASE_URL}/${repoOwner}/${segment}/projects/${projectId}`;
  }
  return `${EVA_BASE_URL}/${repoOwner}/${segment}/quick-tasks/${taskId}`;
}

/** Builds a link to view a session in the Eva web app. */
export function buildEvaSessionUrl(
  repoOwner: string,
  repoName: string,
  sessionId: string,
  rootDirectory?: string,
): string {
  const segment = repoSegment(repoName, rootDirectory);
  return `${EVA_BASE_URL}/${repoOwner}/${segment}/sessions/${sessionId}`;
}
