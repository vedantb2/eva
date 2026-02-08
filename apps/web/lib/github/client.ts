import { Octokit } from "octokit";
import { serverEnv } from "@/env/server";
import { createAppAuth } from "@octokit/auth-app";

const appId = serverEnv.GITHUB_APP_ID;
const privateKey = serverEnv.GITHUB_PRIVATE_KEY;
const clientId = serverEnv.GITHUB_CLIENT_ID;
const clientSecret = serverEnv.GITHUB_CLIENT_SECRET;

export function getAppOctokit() {
  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials not configured");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      clientId,
      clientSecret,
    },
  });
}

export async function getInstallationOctokit(installationId: number) {
  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials not configured");
  }

  const auth = createAppAuth({
    appId,
    privateKey,
    clientId,
    clientSecret,
  });

  const installationAuth = await auth({
    type: "installation",
    installationId,
  });

  return new Octokit({ auth: installationAuth.token });
}

export async function createBranch(params: {
  installationId: number;
  owner: string;
  repo: string;
  branchName: string;
  baseBranch?: string;
}) {
  const {
    installationId,
    owner,
    repo,
    branchName,
    baseBranch = "main",
  } = params;
  const octokit = await getInstallationOctokit(installationId);

  const baseRef = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: "heads/" + baseBranch,
  });

  const newRef = await octokit.rest.git.createRef({
    owner,
    repo,
    ref: "refs/heads/" + branchName,
    sha: baseRef.data.object.sha,
  });

  return {
    name: branchName,
    fullRef: newRef.data.ref,
    sha: newRef.data.object.sha,
    baseBranch,
  };
}

export async function createPullRequest(params: {
  installationId: number;
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
}) {
  const { installationId, owner, repo, title, body, head, base } = params;
  const octokit = await getInstallationOctokit(installationId);

  const pr = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    body,
    head,
    base,
  });

  return {
    number: pr.data.number,
    url: pr.data.html_url,
    state: pr.data.state,
  };
}

export async function getRepository(params: {
  installationId: number;
  owner: string;
  repo: string;
}) {
  const { installationId, owner, repo } = params;
  const octokit = await getInstallationOctokit(installationId);

  const repository = await octokit.rest.repos.get({
    owner,
    repo,
  });

  return {
    id: repository.data.id,
    name: repository.data.name,
    fullName: repository.data.full_name,
    owner: repository.data.owner.login,
    defaultBranch: repository.data.default_branch,
    private: repository.data.private,
    url: repository.data.html_url,
  };
}

export async function listInstallationRepos(installationId: number) {
  const octokit = await getInstallationOctokit(installationId);

  const repos = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });

  return repos.data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    private: repo.private,
    url: repo.html_url,
  }));
}

export async function listBranches(params: {
  installationId: number;
  owner: string;
  repo: string;
}) {
  const { installationId, owner, repo } = params;
  const octokit = await getInstallationOctokit(installationId);

  const branches = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });

  return branches.data.map((branch) => ({
    name: branch.name,
    protected: branch.protected,
  }));
}
