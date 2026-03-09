import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const run = internalMutation({
  args: {},
  returns: v.object({ rootsCreated: v.number(), subAppsLinked: v.number() }),
  handler: async (ctx) => {
    const allRepos = await ctx.db.query("githubRepos").collect();
    let rootsCreated = 0;
    let subAppsLinked = 0;

    const subApps = allRepos.filter((r) => r.rootDirectory !== undefined);

    const monorepoGroups = new Map<string, Array<(typeof allRepos)[number]>>();
    for (const sub of subApps) {
      const key = `${sub.owner}/${sub.name}`;
      const group = monorepoGroups.get(key) ?? [];
      group.push(sub);
      monorepoGroups.set(key, group);
    }

    for (const [, group] of monorepoGroups) {
      const first = group[0];
      let root = allRepos.find(
        (r) =>
          r.owner === first.owner &&
          r.name === first.name &&
          r.rootDirectory === undefined,
      );

      if (!root) {
        const rootId = await ctx.db.insert("githubRepos", {
          owner: first.owner,
          name: first.name,
          installationId: first.installationId,
          githubId: first.githubId,
          connected: true,
          teamId: first.teamId,
          defaultBaseBranch: "main",
          hidden: true,
        });
        root = (await ctx.db.get(rootId)) ?? undefined;
        rootsCreated++;
      }

      if (root) {
        for (const sub of group) {
          if (sub.parentRepoId === undefined) {
            await ctx.db.patch(sub._id, { parentRepoId: root._id });
            subAppsLinked++;
          }
        }
      }
    }

    return { rootsCreated, subAppsLinked };
  },
});
