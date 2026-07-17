"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { getAppOctokit, getInstallationOctokit } from "../githubAuth";
import { detectAppsForRepo } from "./helpers";

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
      syncSettings
        .filter((s: { enabled: boolean }) => !s.enabled)
        .map((s: { owner: string; name: string }) => `${s.owner}/${s.name}`),
    );

    const appOctokit = getAppOctokit();
    const installations = await appOctokit.rest.apps.listInstallations();

    const connectedIds: Array<Id<"githubRepos">> = [];
    const detectedApps: Array<{
      owner: string;
      name: string;
      paths: string[];
    }> = [];
    const monorepos: Array<{ owner: string; name: string }> = [];
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
        for (const app of apps) {
          const subAppId = await ctx.runMutation(internal.githubRepos.upsert, {
            owner: repo.owner.login,
            name: repo.name,
            installationId: installation.id,
            githubId: repo.id,
            teamId: personalTeamId,
            rootDirectory: app.path,
            parentRepoId: id,
          });
          connectedIds.push(subAppId);
          appPaths.push(app.path);
        }
        detectedApps.push({
          owner: repo.owner.login,
          name: repo.name,
          paths: appPaths,
        });
        if (apps.length === 0) {
          connectedIds.push(id);
        } else {
          monorepos.push({ owner: repo.owner.login, name: repo.name });
        }
        totalAdded++;
      }
    }

    await ctx.runMutation(internal.githubRepos.syncConnectedStatus, {
      connectedIds,
    });

    await ctx.runMutation(internal.githubRepos.cleanupStaleSubApps, {
      detectedApps,
    });

    await ctx.runMutation(internal.githubRepos.cleanupMonorepoRoots, {
      monorepos,
    });

    return { success: true, synced: totalAdded };
  },
});
