"use node";

/**
 * Group seeded snapshots — BUILD step. Boots an ephemeral sandbox from the
 * primary repo's own seeded snapshot, clones every linked repo alongside it
 * under `/tmp/workspace/<name>` (installing dependencies), captures the whole
 * filesystem into one `snap_*`, and stores it on the group. Sessions created
 * from the group then boot straight from this snapshot instead of paying the
 * clone + install cost for every linked repo on every fresh sandbox — see
 * `getGroupSnapshotForBoot` / `resolveSandboxContext`.
 *
 * cloneRepoInto / dir-aware detectPackageManager+installDependencies do not
 * exist yet on `_sandbox_runtime/git.ts` at the time this was written, so the
 * clone + install steps below are implemented directly with execHandle +
 * `sandbox.git.clone`, mirroring `cloneAndSetupRepo`'s approach rather than
 * calling it.
 */
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getInstallationToken } from "../githubAuth";
import type { SandboxHandle } from "../_sandbox/provider";
import { execHandle, resolveSandboxContext } from "../_sandbox_runtime/helpers";
import {
  createSandboxAndPrepareRepo,
  EPHEMERAL_LIFECYCLE,
} from "../_sandbox_runtime/git";
import {
  WORKSPACE_ROOT,
  linkedRepoDir,
  primaryLinkPath,
} from "../_sandbox_runtime/workspaceLayout";
import { computeRepoGroupFingerprint } from "./snapshot";

// Large seeded snapshots take well over the SDK's 30s default to boot the
// ephemeral builder sandbox — mirrors createSeedPrepSandbox's readyTimeoutSeconds.
const BUILDER_SANDBOX_READY_TIMEOUT_SECONDS = 180;

// Every convex action has a hard 600s ceiling. Cloning + installing more than
// a handful of repos serially risks blowing through it, so installs (the slow
// part) are skipped past this count — the snapshot still carries the clones,
// just without warm node_modules.
const MAX_LINKED_REPOS_TO_INSTALL = 3;

const CLONE_TIMEOUT_SECONDS = 300;
const INSTALL_TIMEOUT_SECONDS = 600;

function logBuild(message: string): void {
  console.log(`[repoGroups][snapshot] ${message}`);
}

/** Detects a Node package manager under `destDir` and runs its install, best-effort. */
async function installLinkedRepoDependencies(
  sandbox: SandboxHandle,
  destDir: string,
): Promise<void> {
  const pm = (
    await execHandle(
      sandbox,
      [
        `if [ -f ${destDir}/pnpm-lock.yaml ]; then echo pnpm;`,
        `elif [ -f ${destDir}/yarn.lock ]; then echo yarn;`,
        `elif [ -f ${destDir}/package.json ]; then echo npm;`,
        `else echo none; fi`,
      ].join(" "),
      10,
      "/",
    )
  ).trim();
  if (pm === "none") return;
  if (pm === "pnpm") {
    await execHandle(
      sandbox,
      `command -v pnpm >/dev/null 2>&1 || npm install -g pnpm; cd ${destDir} && pnpm install`,
      INSTALL_TIMEOUT_SECONDS,
      "/",
    );
  } else if (pm === "yarn") {
    await execHandle(
      sandbox,
      `command -v yarn >/dev/null 2>&1 || npm install -g yarn; cd ${destDir} && yarn install`,
      INSTALL_TIMEOUT_SECONDS,
      "/",
    );
  } else {
    await execHandle(
      sandbox,
      `cd ${destDir} && npm install`,
      INSTALL_TIMEOUT_SECONDS,
      "/",
    );
  }
}

/**
 * Clones one linked repo into `destDir` on `branch`, using a one-off
 * installation token (never persisted into the sandbox's global git
 * credential helper — this ephemeral builder is deleted right after the
 * capture). The token is stripped from the `origin` remote immediately after
 * cloning so it is never baked into the captured snapshot's filesystem.
 */
async function cloneLinkedRepo(
  sandbox: SandboxHandle,
  installationId: number,
  owner: string,
  name: string,
  branch: string,
  destDir: string,
): Promise<void> {
  const repoUrl = `https://github.com/${owner}/${name}.git`;
  const token = await getInstallationToken(installationId);
  logBuild(`cloning ${owner}/${name}@${branch} into ${destDir}`);
  await execHandle(
    sandbox,
    `rm -rf ${destDir}`,
    30,
    "/",
  );
  await sandbox.git.clone(repoUrl, destDir, "x-access-token", token);
  // Plain `git clone` fetches every branch as a remote-tracking ref, so the
  // target branch (if different from whatever HEAD defaulted to) is already
  // available locally — no second authenticated network call needed.
  await execHandle(
    sandbox,
    `git -C ${destDir} checkout ${branch} 2>/dev/null || git -C ${destDir} checkout -b ${branch} origin/${branch}`,
    CLONE_TIMEOUT_SECONDS,
    "/",
  );
  // Never leave the transient token sitting in `.git/config` — the snapshot's
  // filesystem is what gets captured next.
  await execHandle(
    sandbox,
    `git -C ${destDir} remote set-url origin ${repoUrl}`,
    15,
    "/",
  );
}

/**
 * Builds (or refreshes) a codebase group's seeded snapshot. No-ops when the
 * group's inputs have not changed since the last successful build, or when
 * the primary repo has no seeded snapshot of its own yet to boot from.
 * Best-effort end to end: any failure is logged and leaves the group's
 * existing `seededSnapshotName` / `seededFingerprint` untouched (keep-last-good).
 */
export const buildGroupSnapshot = internalAction({
  args: { groupId: v.id("repoGroups") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const build = await ctx.runQuery(internal.repoGroups.getGroupForBuild, {
      groupId: args.groupId,
    });
    if (!build) {
      logBuild(`group ${args.groupId} or its primary repo no longer exists; skipping`);
      return null;
    }
    const { group, primary, linked } = build;
    if (!primary.seededSnapshotName) {
      logBuild(
        `group ${args.groupId}: primary repo ${primary.owner}/${primary.name} has no seeded snapshot yet; skipping`,
      );
      return null;
    }

    const installDependencies = group.installDependencies !== false;
    const fingerprint = computeRepoGroupFingerprint({
      primarySeededSnapshotName: primary.seededSnapshotName,
      members: linked.map((repo) => ({
        repoId: String(repo.repoId),
        defaultBaseBranch: repo.defaultBaseBranch,
      })),
      installDependencies,
    });

    if (fingerprint === group.seededFingerprint && group.seededSnapshotName) {
      logBuild(
        `group ${args.groupId}: snapshot already current (fingerprint ${fingerprint}); skipping`,
      );
      return null;
    }

    let sandbox: SandboxHandle | undefined;
    try {
      const { client, sandboxEnvVars, snapshotName } = await resolveSandboxContext(
        ctx,
        group.primaryRepoId,
      );
      const created = await createSandboxAndPrepareRepo(
        ctx,
        client,
        primary.installationId,
        primary.owner,
        primary.name,
        sandboxEnvVars,
        EPHEMERAL_LIFECYCLE,
        snapshotName,
        undefined, // onSandboxAcquired
        undefined, // onProgress
        { mode: "none" }, // syncStrategy — this builder is thrown away, no need to sync
        BUILDER_SANDBOX_READY_TIMEOUT_SECONDS,
        true, // skipInstallDeps — primary already carries its own deps
      );
      sandbox = created.sandbox;

      const skipInstalls = linked.length > MAX_LINKED_REPOS_TO_INSTALL;
      if (skipInstalls) {
        logBuild(
          `group ${args.groupId}: ${linked.length} linked repos (> ${MAX_LINKED_REPOS_TO_INSTALL}); skipping dependency installs to stay inside the action's 10-minute ceiling`,
        );
      }

      await execHandle(sandbox, `mkdir -p ${WORKSPACE_ROOT}`, 15, "/");
      await execHandle(
        sandbox,
        `ln -sfn /tmp/repo ${primaryLinkPath(primary.name)}`,
        15,
        "/",
      );

      for (const repo of linked) {
        const destDir = linkedRepoDir(repo.name);
        await cloneLinkedRepo(
          sandbox,
          repo.installationId,
          repo.owner,
          repo.name,
          repo.defaultBaseBranch,
          destDir,
        );
        if (installDependencies && !skipInstalls) {
          await installLinkedRepoDependencies(sandbox, destDir);
        }
      }

      const label = `group-${args.groupId}-${fingerprint.slice(0, 12)}`;
      logBuild(`group ${args.groupId}: capturing snapshot ${label}`);
      const { snapshotId } = await sandbox.createSnapshot({ name: label });

      await ctx.runMutation(internal.repoGroups.setGroupSeededSnapshot, {
        groupId: args.groupId,
        seededSnapshotName: snapshotId,
        seededFingerprint: fingerprint,
      });
      logBuild(
        `group ${args.groupId}: snapshot ${snapshotId} stored (fingerprint ${fingerprint})`,
      );
    } catch (e) {
      logBuild(
        `build failed for group ${args.groupId}: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      if (sandbox) {
        try {
          await sandbox.delete();
        } catch (e) {
          logBuild(
            `failed to delete ephemeral builder sandbox for group ${args.groupId}: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      }
    }
    return null;
  },
});
