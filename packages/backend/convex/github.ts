"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

function normalizePemKey(raw: string): string {
  const cleaned = raw.replace(/\\n/g, "\n").replace(/\\+$/gm, "").trim();
  if (cleaned.includes("\n")) return cleaned;

  const base64 = cleaned
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s/g, "");

  const isRsa = cleaned.includes("RSA PRIVATE KEY");
  const header = isRsa
    ? "-----BEGIN RSA PRIVATE KEY-----"
    : "-----BEGIN PRIVATE KEY-----";
  const footer = isRsa
    ? "-----END RSA PRIVATE KEY-----"
    : "-----END PRIVATE KEY-----";
  const lines: string[] = [header];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  lines.push(footer);
  return lines.join("\n");
}

function getGitHubCredentials() {
  const appId = process.env.GITHUB_APP_ID;
  const rawKey = process.env.GITHUB_PRIVATE_KEY;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!appId || !rawKey) {
    throw new Error("GitHub App credentials not configured");
  }
  return {
    appId,
    privateKey: normalizePemKey(rawKey),
    clientId: clientId ?? "",
    clientSecret: clientSecret ?? "",
  };
}

function getAppOctokit(): Octokit {
  const creds = getGitHubCredentials();
  return new Octokit({
    authStrategy: createAppAuth,
    auth: creds,
  });
}

async function getInstallationOctokit(
  installationId: number,
): Promise<Octokit> {
  const creds = getGitHubCredentials();
  const auth = createAppAuth(creds);
  const installationAuth = await auth({
    type: "installation",
    installationId,
  });
  return new Octokit({ auth: installationAuth.token });
}

export const getInstallationTokenAction = action({
  args: { installationId: v.number() },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const creds = getGitHubCredentials();
    const auth = createAppAuth(creds);
    const installationAuth = await auth({
      type: "installation",
      installationId: args.installationId,
    });
    return { token: installationAuth.token };
  },
});

export const listBranches = action({
  args: {
    installationId: v.number(),
    owner: v.string(),
    repo: v.string(),
  },
  returns: v.array(v.object({ name: v.string(), protected: v.boolean() })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const octokit = await getInstallationOctokit(args.installationId);
    const allBranches = await octokit.paginate(
      octokit.rest.repos.listBranches,
      {
        owner: args.owner,
        repo: args.repo,
        per_page: 100,
      },
    );
    return allBranches.map((b) => ({ name: b.name, protected: b.protected }));
  },
});

export const listRepos = action({
  args: { installationId: v.number() },
  returns: v.array(
    v.object({
      id: v.number(),
      name: v.string(),
      fullName: v.string(),
      owner: v.string(),
      private: v.boolean(),
      url: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const octokit = await getInstallationOctokit(args.installationId);
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
  },
});

export const createSessionPr = action({
  args: { sessionId: v.id("sessions") },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) throw new Error("Session not found");
    if (!session.branchName) {
      throw new Error("No branch associated with this session");
    }
    if (session.prUrl) {
      return { url: session.prUrl };
    }

    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: session.repoId,
    });
    if (!repo) throw new Error("Repository not found");

    const octokit = await getInstallationOctokit(repo.installationId);
    const pr = await octokit.rest.pulls.create({
      owner: repo.owner,
      repo: repo.name,
      title: session.title,
      body: `Session: ${session.title}\n\n---\n*Created by Eva AI Agent*`,
      head: session.branchName,
      base: "main",
    });

    await ctx.runMutation(internal.sessions.setPrUrl, {
      id: args.sessionId,
      prUrl: pr.data.html_url,
    });

    return { url: pr.data.html_url };
  },
});

export const syncRepos = action({
  args: {},
  returns: v.object({ success: v.boolean(), synced: v.number() }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const appOctokit = getAppOctokit();
    const installations = await appOctokit.rest.apps.listInstallations();

    const connectedIds: Array<Id<"githubRepos">> = [];
    let totalAdded = 0;
    for (const installation of installations.data) {
      const octokit = await getInstallationOctokit(installation.id);
      const repos = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100,
      });

      for (const repo of repos.data.repositories) {
        const id = await ctx.runMutation(internal.githubRepos.upsert, {
          owner: repo.owner.login,
          name: repo.name,
          installationId: installation.id,
        });
        connectedIds.push(id);
        totalAdded++;
      }
    }

    await ctx.runMutation(internal.githubRepos.syncConnectedStatus, {
      connectedIds,
    });

    return { success: true, synced: totalAdded };
  },
});
