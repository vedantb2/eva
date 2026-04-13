"use node";

import type { Sandbox } from "@daytonaio/sdk";
import type { Octokit } from "octokit";
import { quote } from "shell-quote";
import { getInstallationOctokit } from "../githubAuth";
import { exec, workspaceDirShell } from "./helpers";
import { resolveBaseTarget } from "./git";

type TreeMode = "100644" | "100755" | "120000";

type FileDiff = {
  status: "A" | "M" | "D";
  path: string;
};

type FileChange =
  | {
      kind: "delete";
      path: string;
    }
  | {
      kind: "upsert";
      path: string;
      mode: TreeMode;
      contentBase64: string;
    };

type BranchHead = {
  commitSha: string;
  treeSha: string;
};

type PublishResult = {
  changedFiles: number;
  createdBranch: boolean;
  commitSha: string;
};

type TreeEntry =
  | {
      path: string;
      mode: "100644";
      type: "blob";
      sha: null;
    }
  | {
      path: string;
      mode: TreeMode;
      type: "blob";
      sha: string;
    };

function logPublish(message: string): void {
  console.log(`[daytona][publish] ${message}`);
}

function getErrorStatus(error: object): number | null {
  const status = Reflect.get(error, "status");
  return typeof status === "number" ? status : null;
}

function parseNameStatusZ(output: string): FileDiff[] {
  if (!output) {
    return [];
  }
  const parts = output.split("\0").filter((part) => part.length > 0);
  const changes: FileDiff[] = [];
  for (let index = 0; index + 1 < parts.length; index += 2) {
    const status = parts[index];
    const path = parts[index + 1];
    if (!path) {
      continue;
    }
    if (status === "A" || status === "M" || status === "D") {
      changes.push({ status, path });
    }
  }
  return changes;
}

async function resolvePublishBaseRef(
  sandbox: Sandbox,
  branchName: string,
  baseBranch: string,
): Promise<string> {
  const workspaceDir = workspaceDirShell();
  const quotedRemoteBranchRef = quote([`refs/remotes/origin/${branchName}`]);
  const branchRefSource = (
    await exec(
      sandbox,
      `cd ${workspaceDir} && if git rev-parse --verify --quiet ${quotedRemoteBranchRef} >/dev/null; then printf remote; else printf base; fi`,
      10,
    )
  ).trim();
  if (branchRefSource === "remote") {
    return `origin/${branchName}`;
  }
  const { ref } = await resolveBaseTarget(sandbox, baseBranch);
  return ref;
}

async function getSandboxCommitMessage(sandbox: Sandbox): Promise<string> {
  const workspaceDir = workspaceDirShell();
  const message = (
    await exec(sandbox, `cd ${workspaceDir} && git log -1 --pretty=%B`, 10)
  ).trim();
  return message.length > 0 ? message : "chore: update branch";
}

async function getSandboxFileMode(
  sandbox: Sandbox,
  path: string,
): Promise<TreeMode> {
  const workspaceDir = workspaceDirShell();
  const output = (
    await exec(
      sandbox,
      `cd ${workspaceDir} && git ls-tree HEAD -- ${quote([path])}`,
      10,
    )
  ).trim();
  const mode = output.split(/\s+/)[0];
  if (mode === "100755" || mode === "120000") {
    return mode;
  }
  return "100644";
}

async function getSandboxFileContentBase64(
  sandbox: Sandbox,
  path: string,
): Promise<string> {
  const workspaceDir = workspaceDirShell();
  const objectSpec = quote([`HEAD:${path}`]);
  return (
    await exec(
      sandbox,
      `cd ${workspaceDir} && git show ${objectSpec} | base64 | tr -d '\n'`,
      30,
    )
  ).trim();
}

async function collectSandboxChanges(
  sandbox: Sandbox,
  branchName: string,
  baseBranch: string,
): Promise<{
  changes: FileChange[];
  commitMessage: string;
}> {
  const workspaceDir = workspaceDirShell();
  const publishBaseRef = await resolvePublishBaseRef(
    sandbox,
    branchName,
    baseBranch,
  );
  const quotedRange = quote([`${publishBaseRef}..HEAD`]);
  const diffOutput = await exec(
    sandbox,
    `cd ${workspaceDir} && git diff --name-status -z --no-renames ${quotedRange}`,
    15,
  );
  const commitMessage = await getSandboxCommitMessage(sandbox);
  const fileDiffs = parseNameStatusZ(diffOutput);
  const changes: FileChange[] = [];
  for (const fileDiff of fileDiffs) {
    if (fileDiff.status === "D") {
      changes.push({
        kind: "delete",
        path: fileDiff.path,
      });
      continue;
    }
    const mode = await getSandboxFileMode(sandbox, fileDiff.path);
    const contentBase64 = await getSandboxFileContentBase64(
      sandbox,
      fileDiff.path,
    );
    changes.push({
      kind: "upsert",
      path: fileDiff.path,
      mode,
      contentBase64,
    });
  }
  return { changes, commitMessage };
}

async function getBranchHead(
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
): Promise<BranchHead | null> {
  try {
    const { data: branch } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch: branchName,
    });
    const commitSha = branch.commit.sha;
    const { data: commit } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });
    return {
      commitSha,
      treeSha: commit.tree.sha,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      getErrorStatus(error) === 404
    ) {
      return null;
    }
    throw error;
  }
}

export async function publishSandboxBranch(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string,
): Promise<PublishResult> {
  const details = `${owner}/${repo}, branch=${branchName}, base=${baseBranch}`;
  const startedAt = Date.now();
  logPublish(`publishSandboxBranch started (${details})`);

  const octokit = await getInstallationOctokit(installationId);
  const branchHead = await getBranchHead(octokit, owner, repo, branchName);
  const baseHead =
    branchHead ?? (await getBranchHead(octokit, owner, repo, baseBranch));

  if (!baseHead) {
    throw new Error(
      `Could not resolve branch head for ${branchName} or base branch ${baseBranch}`,
    );
  }

  const { changes, commitMessage } = await collectSandboxChanges(
    sandbox,
    branchName,
    baseBranch,
  );

  if (changes.length === 0) {
    if (!branchHead) {
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseHead.commitSha,
      });
      logPublish(
        `publishSandboxBranch created branch without file changes in ${Date.now() - startedAt}ms (${details})`,
      );
      return {
        changedFiles: 0,
        createdBranch: true,
        commitSha: baseHead.commitSha,
      };
    }
    logPublish(
      `publishSandboxBranch no-op in ${Date.now() - startedAt}ms (${details})`,
    );
    return {
      changedFiles: 0,
      createdBranch: false,
      commitSha: baseHead.commitSha,
    };
  }

  const treeEntries: TreeEntry[] = [];
  for (const change of changes) {
    if (change.kind === "delete") {
      treeEntries.push({
        path: change.path,
        mode: "100644",
        type: "blob",
        sha: null,
      });
      continue;
    }
    const { data: blob } = await octokit.rest.git.createBlob({
      owner,
      repo,
      content: change.contentBase64,
      encoding: "base64",
    });
    treeEntries.push({
      path: change.path,
      mode: change.mode,
      type: "blob",
      sha: blob.sha,
    });
  }

  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseHead.treeSha,
    tree: treeEntries,
  });

  const { data: commit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: tree.sha,
    parents: [baseHead.commitSha],
  });

  if (branchHead) {
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
      sha: commit.sha,
      force: true,
    });
  } else {
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: commit.sha,
    });
  }

  logPublish(
    `publishSandboxBranch completed in ${Date.now() - startedAt}ms (${details}, changedFiles=${changes.length})`,
  );
  return {
    changedFiles: changes.length,
    createdBranch: branchHead === null,
    commitSha: commit.sha,
  };
}
