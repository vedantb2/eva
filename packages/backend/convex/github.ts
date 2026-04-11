"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import {
  normalizePemKey,
  getGitHubCredentials,
  getInstallationOctokit,
  getInstallationToken,
} from "./githubAuth";
import { buildPrBody } from "./taskWorkflowActions";

/** Creates an Octokit client authenticated as the GitHub App itself (not an installation). */
function getAppOctokit(): Octokit {
  const creds = getGitHubCredentials();
  return new Octokit({
    authStrategy: createAppAuth,
    auth: creds,
  });
}

/** Returns a short-lived installation token for a given GitHub repo's app installation. */
export const getInstallationTokenAction = action({
  args: { repoId: v.id("githubRepos") },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });
    if (!repo) throw new Error("Repository not found");
    const token = await getInstallationToken(repo.installationId);
    return { token };
  },
});

/** Lists all branches for a given repository via the GitHub API. */
export const listBranches = action({
  args: {
    installationId: v.number(),
    owner: v.string(),
    repo: v.string(),
  },
  returns: v.array(v.object({ name: v.string(), protected: v.boolean() })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
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

/** Lists all repositories accessible to a specific GitHub App installation. */
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
    if (!identity) {
      throw new Error("Not authenticated");
    }
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

/** Creates a GitHub pull request for a session's branch and stores the PR URL. */
export const createSessionPr = action({
  args: { sessionId: v.id("sessions") },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
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

    const appLabel = repo.rootDirectory
      ? repo.rootDirectory.split("/").pop()
      : undefined;

    const summaryContent =
      session.summary && session.summary.length > 0
        ? session.summary.map((item) => `- ${item}`).join("\n")
        : "No summary available";

    // Gather proof links (images/videos) from session messages
    const messages = await ctx.runQuery(
      internal.messages.listByParentInternal,
      { parentId: args.sessionId },
    );
    const proofItems: string[] = [];
    for (const msg of messages) {
      if (msg.imageUrl) {
        proofItems.push(`![Screenshot](${msg.imageUrl})`);
      }
      if (msg.videoUrl) {
        proofItems.push(`[Video Recording](${msg.videoUrl})`);
      }
    }

    const sections: Array<{ heading: string; content: string }> = [
      { heading: "Summary", content: summaryContent },
    ];
    if (proofItems.length > 0) {
      sections.push({ heading: "Proof", content: proofItems.join("\n") });
    }

    const prUrl = await ctx.runAction(
      internal.taskWorkflowActions.createPullRequest,
      {
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName: session.branchName,
        title: session.title,
        body: buildPrBody(sections),
        labels: ["eva", "session", ...(appLabel ? [appLabel] : [])],
      },
    );

    if (!prUrl) {
      throw new Error("Failed to create PR");
    }

    await ctx.runMutation(internal.sessions.setPrUrl, {
      id: args.sessionId,
      prUrl,
    });

    return { url: prUrl };
  },
});

/** Scans the apps/ directory of a repo to detect monorepo sub-applications. */
async function detectAppsForRepo(
  octokit: Octokit,
  owner: string,
  name: string,
): Promise<Array<{ name: string; path: string; hasDevScript: boolean }>> {
  const apps: Array<{ name: string; path: string; hasDevScript: boolean }> = [];

  try {
    const { data: entries } = await octokit.rest.repos.getContent({
      owner,
      repo: name,
      path: "apps",
    });

    if (!Array.isArray(entries)) return [];

    for (const entry of entries) {
      if (entry.type !== "dir") continue;
      const appPath = `apps/${entry.name}`;
      let hasDevScript = false;
      try {
        const { data: appPkg } = await octokit.rest.repos.getContent({
          owner,
          repo: name,
          path: `${appPath}/package.json`,
        });
        if ("content" in appPkg) {
          const decoded = Buffer.from(appPkg.content, "base64").toString();
          const pkg: Record<string, unknown> = JSON.parse(decoded);
          const scripts =
            pkg.scripts && typeof pkg.scripts === "object"
              ? (pkg.scripts as Record<string, unknown>)
              : {};
          hasDevScript = typeof scripts.dev === "string";
        }
      } catch {
        // no package.json in this app dir
      }
      apps.push({ name: entry.name, path: appPath, hasDevScript });
    }
  } catch {
    // apps/ directory doesn't exist — not a monorepo with apps
  }

  return apps;
}

/** Detects monorepo sub-applications in a repository's apps/ directory. */
export const detectMonorepoApps = action({
  args: {
    installationId: v.number(),
    owner: v.string(),
    name: v.string(),
  },
  returns: v.array(
    v.object({
      name: v.string(),
      path: v.string(),
      hasDevScript: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const octokit = await getInstallationOctokit(args.installationId);
    return detectAppsForRepo(octokit, args.owner, args.name);
  },
});

/** Lists all repos across all GitHub App installations for discovery. */
export const listAllAvailableRepos = action({
  args: {},
  returns: v.array(
    v.object({
      owner: v.string(),
      name: v.string(),
      githubId: v.number(),
      private: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const appOctokit = getAppOctokit();
    const installations = await appOctokit.rest.apps.listInstallations();

    const results: Array<{
      owner: string;
      name: string;
      githubId: number;
      private: boolean;
    }> = [];

    for (const installation of installations.data) {
      const octokit = await getInstallationOctokit(installation.id);
      const repos = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100,
      });

      for (const repo of repos.data.repositories) {
        results.push({
          owner: repo.owner.login,
          name: repo.name,
          githubId: repo.id,
          private: repo.private,
        });
      }
    }

    return results;
  },
});

/** Syncs all GitHub App installation repos into the database, detecting monorepo apps and updating connected status. */
export const syncRepos = action({
  args: {},
  returns: v.object({ success: v.boolean(), synced: v.number() }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(internal.auth.getUserByClerkId, {
      clerkId: identity.subject,
    });
    if (!user) {
      throw new Error("User not found");
    }

    const personalTeamId = await ctx.runMutation(
      internal.teams.getOrCreatePersonal,
      {
        userId: user._id,
      },
    );

    const syncSettings = await ctx.runQuery(internal.syncSettings.listAll, {});
    const disabledRepos = new Set(
      syncSettings.filter((s) => !s.enabled).map((s) => `${s.owner}/${s.name}`),
    );

    const appOctokit = getAppOctokit();
    const installations = await appOctokit.rest.apps.listInstallations();

    const connectedIds: Array<Id<"githubRepos">> = [];
    const detectedApps: Array<{
      owner: string;
      name: string;
      paths: string[];
    }> = [];
    let totalAdded = 0;
    for (const installation of installations.data) {
      const octokit = await getInstallationOctokit(installation.id);
      const repos = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100,
      });

      for (const repo of repos.data.repositories) {
        if (disabledRepos.has(`${repo.owner.login}/${repo.name}`)) {
          continue;
        }

        const id = await ctx.runMutation(internal.githubRepos.upsert, {
          owner: repo.owner.login,
          name: repo.name,
          installationId: installation.id,
          githubId: repo.id,
          teamId: personalTeamId,
        });

        const apps = await detectAppsForRepo(
          octokit,
          repo.owner.login,
          repo.name,
        );

        const appPaths: string[] = [];
        if (apps.length > 0) {
          for (const app of apps) {
            const subAppId = await ctx.runMutation(
              internal.githubRepos.upsert,
              {
                owner: repo.owner.login,
                name: repo.name,
                installationId: installation.id,
                githubId: repo.id,
                teamId: personalTeamId,
                rootDirectory: app.path,
                parentRepoId: id,
              },
            );
            connectedIds.push(subAppId);
            appPaths.push(app.path);
          }
        }
        detectedApps.push({
          owner: repo.owner.login,
          name: repo.name,
          paths: appPaths,
        });
        connectedIds.push(id);
        totalAdded++;
      }
    }

    await ctx.runMutation(internal.githubRepos.syncConnectedStatus, {
      connectedIds,
    });

    await ctx.runMutation(internal.githubRepos.cleanupStaleSubApps, {
      detectedApps,
    });

    return { success: true, synced: totalAdded };
  },
});
