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
  DAYTONA_CREATE_TIMEOUT_MS,
  ensureSandboxRunning,
  withTimeout,
} from "./helpers";
import { detectPackageManager } from "./devServer";

export type SandboxLifecycle = {
  autoStopInterval: number;
  autoDeleteInterval: number;
  ephemeral?: boolean;
};

const SESSION_LIFECYCLE: SandboxLifecycle = {
  autoStopInterval: 30,
  autoDeleteInterval: 30,
};

const EPHEMERAL_LIFECYCLE: SandboxLifecycle = {
  autoStopInterval: 0,
  autoDeleteInterval: 0,
  ephemeral: true,
};

const WARMING_LIFECYCLE: SandboxLifecycle = {
  autoStopInterval: 5,
  autoDeleteInterval: 0,
  ephemeral: true,
};

export { SESSION_LIFECYCLE, EPHEMERAL_LIFECYCLE, WARMING_LIFECYCLE };

export async function createSandbox(
  daytona: Daytona,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
  lifecycle: SandboxLifecycle,
  snapshotName?: string,
  volumes?: VolumeMount[],
): Promise<Sandbox> {
  const timeoutSeconds = snapshotName
    ? SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS
    : DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS;

  const githubToken = await getInstallationToken(installationId);

  const sandbox = await withTimeout(
    daytona.create(
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
        autoStopInterval: lifecycle.autoStopInterval,
        autoDeleteInterval: lifecycle.autoDeleteInterval,
        ...(lifecycle.ephemeral ? { ephemeral: true } : {}),
      },
      { timeout: timeoutSeconds },
    ),
    DAYTONA_CREATE_TIMEOUT_MS,
    "create",
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
    `cd ${WORKSPACE_DIR} && git stash --include-untracked 2>/dev/null || true`,
    10,
  );
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
    `cd ${WORKSPACE_DIR} && git merge --ff-only ${quotedRemote} 2>/dev/null || true`,
    10,
  );
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git merge ${quotedBase} --no-edit --allow-unrelated-histories || git merge --abort 2>/dev/null || true`,
    30,
  );
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
  lifecycle: SandboxLifecycle,
  snapshotName?: string,
  volumes?: VolumeMount[],
  onSandboxAcquired?: (sandbox: Sandbox) => Promise<void>,
  onProgress?: (label: string) => Promise<void>,
): Promise<{ sandbox: Sandbox; usedSnapshot: boolean }> {
  let sandbox: Sandbox | undefined;
  try {
    if (onProgress) await onProgress("Creating sandbox...");
    sandbox = await createSandbox(
      daytona,
      installationId,
      sandboxEnvVars,
      lifecycle,
      snapshotName,
      volumes,
    );
    if (onSandboxAcquired) {
      await onSandboxAcquired(sandbox);
    }
    if (snapshotName) {
      if (onProgress) await onProgress("Syncing repository...");
      await syncRepo(sandbox, installationId, owner, name);
      return { sandbox, usedSnapshot: true };
    }
    await cloneAndSetupRepo(sandbox, installationId, owner, name, onProgress);
    return { sandbox, usedSnapshot: false };
  } catch (error) {
    if (sandbox) {
      try {
        await sandbox.delete();
      } catch {}
    }
    throw error;
  }
}

export async function getOrCreateSandbox(
  daytona: Daytona,
  existingSandboxId: string | undefined,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  lifecycle: SandboxLifecycle,
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
    lifecycle,
    snapshotName,
    volumes,
    undefined,
    onProgress,
  );
  return { sandbox, isNew: true };
}
