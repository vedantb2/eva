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
  withTimeout,
  DAYTONA_CREATE_TIMEOUT_PADDING_MS,
  DAYTONA_GET_TIMEOUT_MS,
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
  const createTimeoutMs =
    timeoutSeconds * 1000 + DAYTONA_CREATE_TIMEOUT_PADDING_MS;

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
        autoStopInterval: 15,
        autoDeleteInterval: 30,
      },
      { timeout: timeoutSeconds },
    ),
    createTimeoutMs,
    "daytona.create",
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
): Promise<void> {
  const quotedBranch = quote([branchName]);
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quote([`origin/${branchName}`])} || git checkout -b ${quotedBranch})`,
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

export async function ensureWorkspaceDependencies(
  sandbox: Sandbox,
): Promise<void> {
  const pm = await detectPackageManager(sandbox);
  await installDependencies(sandbox, pm);
}

export async function cloneAndSetupRepo(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<void> {
  const githubToken = await getInstallationToken(installationId);
  const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
  await exec(
    sandbox,
    `rm -rf ${WORKSPACE_DIR} && git clone ${quote([repoUrl])} ${quote([WORKSPACE_DIR])}`,
    120,
  );
  await ensureWorkspaceDependencies(sandbox);
}

export async function setupBranch(
  sandbox: Sandbox,
  branchName: string,
): Promise<void> {
  const quotedBranch = quote([branchName]);
  const quotedRemote = quote([`origin/${branchName}`]);
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git stash --include-untracked 2>/dev/null || true`,
    10,
  );
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quotedRemote} || git checkout -B ${quotedBranch})`,
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

export async function acquireSandbox(
  daytona: Daytona,
  existingSandboxId: string | undefined,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
  snapshotName?: string,
  volumes?: VolumeMount[],
): Promise<{ sandbox: Sandbox; isNew: boolean }> {
  if (existingSandboxId) {
    try {
      const sandbox = await withTimeout(
        daytona.get(existingSandboxId),
        DAYTONA_GET_TIMEOUT_MS,
        `daytona.get(${existingSandboxId})`,
      );
      await ensureSandboxRunning(sandbox);
      return { sandbox, isNew: false };
    } catch {}
  }

  const sandbox = await createSandbox(
    daytona,
    installationId,
    sandboxEnvVars,
    snapshotName,
    volumes,
  );
  return { sandbox, isNew: true };
}

export async function prepareSandboxRepo(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
  opts: { isNew: boolean; snapshotName?: string },
): Promise<void> {
  if (!opts.isNew) {
    await syncRepo(sandbox, installationId, owner, name);
    await ensureWorkspaceDependencies(sandbox);
    return;
  }
  if (opts.snapshotName) {
    await syncRepo(sandbox, installationId, owner, name);
    await ensureWorkspaceDependencies(sandbox);
    return;
  }
  await cloneAndSetupRepo(sandbox, installationId, owner, name);
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
): Promise<{ sandbox: Sandbox; usedSnapshot: boolean }> {
  let initialSandbox: Sandbox | undefined;
  try {
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
    await prepareSandboxRepo(initialSandbox, installationId, owner, name, {
      isNew: true,
      snapshotName,
    });
    return { sandbox: initialSandbox, usedSnapshot: Boolean(snapshotName) };
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
      await prepareSandboxRepo(sandbox, installationId, owner, name, {
        isNew: true,
        snapshotName,
      });
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
): Promise<{ sandbox: Sandbox; isNew: boolean }> {
  const acquired = await acquireSandbox(
    daytona,
    existingSandboxId,
    installationId,
    sandboxEnvVars,
    snapshotName,
    volumes,
  );
  await prepareSandboxRepo(acquired.sandbox, installationId, owner, name, {
    isNew: acquired.isNew,
    snapshotName,
  });
  return acquired;
}
