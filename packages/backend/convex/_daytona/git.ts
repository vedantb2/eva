"use node";

import type { Daytona, Sandbox, VolumeMount } from "@daytonaio/sdk";
import { quote } from "shell-quote";
import {
  buildGitHubExtraHeader,
  buildGitHubRepoUrl,
  getInstallationToken,
} from "../githubAuth";
import {
  exec,
  WORKSPACE_DIR,
  SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS,
  DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS,
  isSnapshotReadyTimeoutError,
  ensureSandboxRunning,
} from "./helpers";
import { detectPackageManager } from "./devServer";

export async function createSandbox(
  daytona: Daytona,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
  snapshotName?: string,
  volumes?: VolumeMount[],
): Promise<Sandbox> {
  const timeoutSeconds = snapshotName
    ? SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS
    : DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS;

  const githubToken = await getInstallationToken(installationId);

  const sandbox = await daytona.create(
    {
      ...(snapshotName
        ? { snapshot: snapshotName }
        : { language: "typescript" }),
      ...(volumes ? { volumes } : {}),
      envVars: {
        ...sandboxEnvVars,
        GITHUB_TOKEN: githubToken,
        INSTALLATION_ID: String(installationId),
      },
      autoStopInterval: 15,
      autoDeleteInterval: 30,
    },
    { timeout: timeoutSeconds },
  );
  await exec(
    sandbox,
    'git config --global user.name "Eva" && git config --global user.email "48868398+vedantb2@users.noreply.github.com"',
    10,
  );
  return sandbox;
}

async function configureGitHubOrigin(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<{ authHeader: string }> {
  const githubToken = await getInstallationToken(installationId);
  const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
  const authHeader = buildGitHubExtraHeader(githubToken);

  await exec(
    sandbox,
    [
      `cd ${WORKSPACE_DIR}`,
      "git config --unset-all http.https://github.com/.extraheader >/dev/null 2>&1 || true",
      `git remote set-url origin ${quote([repoUrl])}`,
    ].join(" && "),
    20,
  );

  return { authHeader };
}

export async function fetchOrigin(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
  ref?: string,
  opts?: { prune?: boolean; timeoutSeconds?: number },
): Promise<void> {
  const { authHeader } = await configureGitHubOrigin(
    sandbox,
    installationId,
    owner,
    name,
  );
  const pruneArg = opts?.prune === false ? "" : " --prune";
  const refArg = ref ? ` ${quote([ref])}` : "";
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git -c http.https://github.com/.extraheader=${quote([authHeader])} fetch${pruneArg} origin${refArg}`,
    opts?.timeoutSeconds ?? 60,
  );
}

export async function syncRepo(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<void> {
  await fetchOrigin(sandbox, installationId, owner, name, undefined, {
    prune: true,
    timeoutSeconds: 60,
  });
}

export async function checkoutSessionBranch(
  sandbox: Sandbox,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const quotedBranch = quote([branchName]);
  const quotedBase = quote([`origin/${baseBranch}`]);
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quote([`origin/${branchName}`])} || git checkout -b ${quotedBranch} ${quotedBase})`,
    30,
  );
}

async function installDependencies(
  sandbox: Sandbox,
  pm: string,
): Promise<void> {
  if (pm === "pnpm") {
    await exec(sandbox, `npm install -g pnpm`, 30);
    await exec(sandbox, `cd ${WORKSPACE_DIR} && pnpm install`, 120);
  } else if (pm === "yarn") {
    await exec(sandbox, `cd ${WORKSPACE_DIR} && yarn install`, 120);
  } else {
    await exec(sandbox, `cd ${WORKSPACE_DIR} && npm install`, 120);
  }
}

export async function cloneAndSetupRepo(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
  onProgress?: (label: string) => Promise<void>,
): Promise<void> {
  if (onProgress) await onProgress("Cloning repository...");
  const githubToken = await getInstallationToken(installationId);
  const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
  await exec(
    sandbox,
    `rm -rf ${WORKSPACE_DIR} && git clone ${quote([repoUrl])} ${quote([WORKSPACE_DIR])}`,
    120,
  );
  if (onProgress) await onProgress("Installing dependencies...");
  const pm = await detectPackageManager(sandbox);
  await installDependencies(sandbox, pm);
}

export async function setupBranch(
  sandbox: Sandbox,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const quotedBranch = quote([branchName]);
  const quotedRemote = quote([`origin/${branchName}`]);
  const quotedBase = quote([`origin/${baseBranch}`]);
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git stash --include-untracked 2>/dev/null || true`,
    10,
  );
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quotedRemote} || git checkout -b ${quotedBranch} ${quotedBase})`,
    10,
  );
  const currentBranch = (
    await exec(sandbox, `cd ${WORKSPACE_DIR} && git branch --show-current`, 5)
  ).trim();
  if (currentBranch !== branchName) {
    throw new Error(
      `Failed to switch to branch ${branchName}, currently on: ${currentBranch}`,
    );
  }
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git push -u origin ${quotedBranch} 2>/dev/null || true`,
    30,
  );
}

export async function createSandboxAndPrepareRepo(
  daytona: Daytona,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  snapshotName?: string,
  volumes?: VolumeMount[],
  onSandboxAcquired?: (sandbox: Sandbox) => Promise<void>,
  onProgress?: (label: string) => Promise<void>,
): Promise<{ sandbox: Sandbox; usedSnapshot: boolean }> {
  let initialSandbox: Sandbox | undefined;
  try {
    if (onProgress) await onProgress("Creating sandbox...");
    initialSandbox = await createSandbox(
      daytona,
      installationId,
      sandboxEnvVars,
      snapshotName,
      volumes,
    );
    if (onSandboxAcquired) {
      await onSandboxAcquired(initialSandbox);
    }
    if (snapshotName) {
      if (onProgress) await onProgress("Syncing repository...");
      await syncRepo(initialSandbox, installationId, owner, name);
      return { sandbox: initialSandbox, usedSnapshot: true };
    }
    await cloneAndSetupRepo(
      initialSandbox,
      installationId,
      owner,
      name,
      onProgress,
    );
    return { sandbox: initialSandbox, usedSnapshot: false };
  } catch (error) {
    if (initialSandbox) {
      try {
        await initialSandbox.delete();
      } catch {}
    }

    if (!snapshotName || !isSnapshotReadyTimeoutError(error)) {
      throw error;
    }

    console.warn(
      `[daytona] Snapshot "${snapshotName}" not ready after ${SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS}s for ${owner}/${name}; retrying with same snapshot`,
    );
    if (onProgress) await onProgress("Retrying sandbox creation...");
    const sandbox = await createSandbox(
      daytona,
      installationId,
      sandboxEnvVars,
      snapshotName,
      volumes,
    );
    try {
      if (onSandboxAcquired) {
        await onSandboxAcquired(sandbox);
      }
      if (onProgress) await onProgress("Syncing repository...");
      await syncRepo(sandbox, installationId, owner, name);
      return { sandbox, usedSnapshot: true };
    } catch (retryError) {
      try {
        await sandbox.delete();
      } catch {}
      throw retryError;
    }
  }
}

export async function getOrCreateSandbox(
  daytona: Daytona,
  existingSandboxId: string | undefined,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  snapshotName?: string,
  volumes?: VolumeMount[],
  onProgress?: (label: string) => Promise<void>,
): Promise<{ sandbox: Sandbox; isNew: boolean }> {
  if (existingSandboxId) {
    try {
      if (onProgress) await onProgress("Resuming sandbox...");
      const sandbox = await daytona.get(existingSandboxId);
      await ensureSandboxRunning(sandbox);
      if (onProgress) await onProgress("Syncing repository...");
      await syncRepo(sandbox, installationId, owner, name);
      return { sandbox, isNew: false };
    } catch {
      // Sandbox was deleted/expired or sync failed, fall through to create a new one
    }
  }
  const { sandbox } = await createSandboxAndPrepareRepo(
    daytona,
    installationId,
    owner,
    name,
    sandboxEnvVars,
    snapshotName,
    volumes,
    undefined,
    onProgress,
  );
  return { sandbox, isNew: true };
}
