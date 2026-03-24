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

function getAppOctokit(): Octokit {
  const creds = getGitHubCredentials();
  return new Octokit({
    authStrategy: createAppAuth,
    auth: creds,
  });
}

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

    const prUrl = await ctx.runAction(
      internal.taskWorkflowActions.createPullRequest,
      {
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName: session.branchName,
        title: session.title,
        body: buildPrBody([{ heading: "Summary", content: summaryContent }]),
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

async function detectAppsForRepo(
  octokit: Octokit,
  owner: string,
  name: string,
): Promise<Array<{ name: string; path: string; hasDevScript: boolean }>> {
  const workspaceGlobs: string[] = [];

  try {
    const { data: pkgContent } = await octokit.rest.repos.getContent({
      owner,
      repo: name,
      path: "package.json",
    });
    if ("content" in pkgContent) {
      const decoded = Buffer.from(pkgContent.content, "base64").toString();
      const pkg: Record<string, unknown> = JSON.parse(decoded);
      if (Array.isArray(pkg.workspaces)) {
        workspaceGlobs.push(
          ...(pkg.workspaces as string[]).filter(
            (w): w is string => typeof w === "string",
          ),
        );
      } else if (
        pkg.workspaces &&
        typeof pkg.workspaces === "object" &&
        "packages" in pkg.workspaces &&
        Array.isArray((pkg.workspaces as Record<string, unknown>).packages)
      ) {
        workspaceGlobs.push(
          ...(
            (pkg.workspaces as Record<string, unknown>).packages as string[]
          ).filter((w): w is string => typeof w === "string"),
        );
      }
    }
  } catch {
    // no root package.json or no workspaces field
  }

  if (workspaceGlobs.length === 0) {
    try {
      const { data: pnpmContent } = await octokit.rest.repos.getContent({
        owner,
        repo: name,
        path: "pnpm-workspace.yaml",
      });
      if ("content" in pnpmContent) {
        const decoded = Buffer.from(pnpmContent.content, "base64").toString();
        const lines = decoded.split("\n");
        for (const line of lines) {
          const match = line.match(/^\s*-\s+['"]?([^'"#\s]+)['"]?\s*$/);
          if (match && match[1]) {
            workspaceGlobs.push(match[1]);
          }
        }
      }
    } catch {
      // no pnpm-workspace.yaml
    }
  }

  if (workspaceGlobs.length === 0) {
    return [];
  }

  const baseDirs = new Set<string>();
  for (const glob of workspaceGlobs) {
    const baseDir = glob.replace(/\/\*.*$/, "").replace(/\*.*$/, "");
    if (baseDir) {
      baseDirs.add(baseDir);
    }
  }

  const apps: Array<{ name: string; path: string; hasDevScript: boolean }> = [];

  for (const baseDir of baseDirs) {
    try {
      const { data: entries } = await octokit.rest.repos.getContent({
        owner,
        repo: name,
        path: baseDir,
      });

      if (!Array.isArray(entries)) continue;

      for (const entry of entries) {
        if (entry.type !== "dir") continue;
        const appPath = `${baseDir}/${entry.name}`;
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
      // base dir doesn't exist
    }
  }

  return apps;
}

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
        const appsUnderAppsDir = apps.filter((a) => a.path.startsWith("apps/"));

        const appPaths: string[] = [];
        if (appsUnderAppsDir.length > 0) {
          for (const app of appsUnderAppsDir) {
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
