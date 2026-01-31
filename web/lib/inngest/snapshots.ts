import { Daytona, Image } from "@daytonaio/sdk";

const daytona = new Daytona();

export interface SnapshotConfig {
  name: string;
  branch: string;
  repoOwner: string;
  repoName: string;
}

export function getSnapshotName(repoOwner: string, repoName: string, branch: string): string {
  const sanitizedBranch = branch.replace(/[^a-zA-Z0-9-]/g, "-");
  return `${repoOwner}-${repoName}-${sanitizedBranch}`.toLowerCase();
}

export async function listSnapshots() {
  const result = await daytona.snapshot.list();
  return result.items;
}

export async function getSnapshot(name: string) {
  try {
    return await daytona.snapshot.get(name);
  } catch {
    return null;
  }
}

export async function deleteSnapshot(name: string) {
  const snapshot = await getSnapshot(name);
  if (snapshot) {
    await daytona.snapshot.delete(snapshot);
  }
}

export async function createRepoSnapshot(
  config: SnapshotConfig,
  githubToken: string,
  onLogs?: (chunk: string) => void
) {
  const { name, branch, repoOwner, repoName } = config;

  const existingSnapshot = await getSnapshot(name);
  if (existingSnapshot) {
    await daytona.snapshot.delete(existingSnapshot);
  }

  const repoUrl = `https://x-access-token:${githubToken}@github.com/${repoOwner}/${repoName}.git`;

  const image = Image.base("node:20-slim")
    .runCommands(
      "apt-get update && apt-get install -y git curl",
      "npm install -g pnpm@latest",
      `git clone --branch ${branch} --single-branch ${repoUrl} /home/daytona/workspace`
    )
    .workdir("/home/daytona/workspace")
    .runCommands("pnpm install")
    .env({ PNPM_HOME: "/root/.local/share/pnpm" });

  const snapshot = await daytona.snapshot.create(
    { name, image },
    {
      onLogs: onLogs || console.log,
      timeout: 600000,
    }
  );

  return snapshot;
}

export async function refreshSnapshot(
  repoOwner: string,
  repoName: string,
  branch: string,
  githubToken: string,
  onLogs?: (chunk: string) => void
) {
  const name = getSnapshotName(repoOwner, repoName, branch);

  return createRepoSnapshot(
    { name, branch, repoOwner, repoName },
    githubToken,
    onLogs
  );
}

export async function getOrCreateSnapshot(
  repoOwner: string,
  repoName: string,
  branch: string,
  githubToken: string
) {
  const name = getSnapshotName(repoOwner, repoName, branch);

  const existing = await getSnapshot(name);
  if (existing) {
    return { snapshot: existing, created: false };
  }

  const snapshot = await createRepoSnapshot(
    { name, branch, repoOwner, repoName },
    githubToken
  );

  return { snapshot, created: true };
}
