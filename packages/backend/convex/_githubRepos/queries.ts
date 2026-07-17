import { v } from "convex/values";
import type { GenericDatabaseReader, StorageReader } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";
import { internalQuery } from "../_generated/server";
import { authQuery } from "../functions";
import {
  githubRepoValidator,
  githubRepoWithLogoValidator,
  pickDefaultVisibleAppRepo,
} from "./helpers";
import {
  getAIProviderAvailability,
  PROVIDER_PRIMARY_AUTH_KEY,
} from "../validators";
import { filterActiveEntities } from "../numId";

/** True when the user connected the repo or shares its team. */
async function userCanAccessRepo(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
  repo: Doc<"githubRepos">,
): Promise<boolean> {
  if (repo.connectedBy === userId) return true;
  const teamId = repo.teamId;
  if (!teamId) return false;
  const membership = await db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userId", userId),
    )
    .first();
  return membership !== null;
}

/** All repos the user can access (connected + team), de-duplicated. */
async function gatherAccessibleRepos(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
  includeHidden: boolean,
): Promise<Array<Doc<"githubRepos">>> {
  const userTeamMemberships = await db
    .query("teamMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const teamRepoResults = await Promise.all(
    userTeamMemberships.map((m) =>
      db
        .query("githubRepos")
        .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
        .collect(),
    ),
  );

  const connectedRepos = await db
    .query("githubRepos")
    .withIndex("by_connected_by", (q) => q.eq("connectedBy", userId))
    .collect();

  const seen = new Set<string>();
  const repos: Array<Doc<"githubRepos">> = [];
  for (const repo of [...connectedRepos, ...teamRepoResults.flat()]) {
    if (seen.has(String(repo._id))) continue;
    seen.add(String(repo._id));
    if (!includeHidden && repo.hidden === true) continue;
    repos.push(repo);
  }
  return repos;
}

/** True when this app has a live sandbox on a session, quick task, or project. */
async function repoHasActiveSandbox(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<boolean> {
  // Active sessions per repo are few — indexed status lookup, then skip archived /
  // sandboxes-without-id. Early exit avoids project/task reads when a session is live.
  const activeSession = filterActiveEntities(
    await db
      .query("sessions")
      .withIndex("by_repo_and_status", (q) =>
        q.eq("repoId", repoId).eq("status", "active"),
      )
      .take(16),
  ).find((s) => s.archived !== true && s.sandboxId !== undefined);
  if (activeSession) return true;

  // Indexed existence checks (not full table scans): at most a handful of docs.
  const activeProject = filterActiveEntities(
    await db
      .query("projects")
      .withIndex("by_repo_and_sandbox_status", (q) =>
        q.eq("repoId", repoId).eq("reviewProjectSandboxStatus", "active"),
      )
      .take(8),
  ).find((p) => p.sandboxId !== undefined);
  if (activeProject) return true;

  const activeTask = filterActiveEntities(
    await db
      .query("agentTasks")
      .withIndex("by_repo_and_sandbox_status", (q) =>
        q.eq("repoId", repoId).eq("reviewTaskSandboxStatus", "active"),
      )
      .take(8),
  ).find((t) => t.sandboxId !== undefined);
  return activeTask !== undefined;
}

/** Attaches a resolved `logoUrl` (from `logoStorageId`) to each repo. */
async function attachLogoUrls(
  storage: StorageReader,
  repos: Array<Doc<"githubRepos">>,
): Promise<Array<Doc<"githubRepos"> & { logoUrl?: string | null }>> {
  return await Promise.all(
    repos.map(async (repo) => ({
      ...repo,
      logoUrl: repo.logoStorageId
        ? await storage.getUrl(repo.logoStorageId)
        : undefined,
    })),
  );
}

/** Lists all GitHub repos accessible to the current user across their teams. */
export const list = authQuery({
  args: {
    includeHidden: v.optional(v.boolean()),
  },
  returns: v.array(githubRepoWithLogoValidator),
  handler: async (ctx, args) => {
    const repos = await gatherAccessibleRepos(
      ctx.db,
      ctx.userId,
      args.includeHidden === true,
    );
    return await attachLogoUrls(ctx.storage, repos);
  },
});

/**
 * Repo/app ids that currently have an active sandbox on a session, quick task,
 * or project. Used by the left rail to show a live indicator on app icons.
 */
export const listReposWithActiveSandboxes = authQuery({
  args: {},
  returns: v.array(v.id("githubRepos")),
  handler: async (ctx) => {
    const repos = await gatherAccessibleRepos(ctx.db, ctx.userId, false);
    const flags = await Promise.all(
      repos.map(async (repo) => ({
        id: repo._id,
        active: await repoHasActiveSandbox(ctx.db, repo._id),
      })),
    );
    return flags.filter((f) => f.active).map((f) => f.id);
  },
});

/** Resolves the current logo image URL for a repo (null when none set). */
export const getLogoUrl = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return null;
    if (!(await userCanAccessRepo(ctx.db, ctx.userId, repo))) return null;
    if (!repo.logoStorageId) return null;
    return await ctx.storage.getUrl(repo.logoStorageId);
  },
});

/** Gets a single GitHub repo by ID if the current user has access. */
export const get = authQuery({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.id);
    if (!repo) return null;
    if (repo.hidden === true) return null;
    return (await userCanAccessRepo(ctx.db, ctx.userId, repo)) ? repo : null;
  },
});

/** Gets a single GitHub repo from a URL-provided ID string if the current user has access. */
export const getByIdString = authQuery({
  args: { repoId: v.string() },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("githubRepos", args.repoId);
    if (!id) return null;

    const repo = await ctx.db.get(id);
    if (!repo) return null;
    if (repo.hidden === true) return null;
    return (await userCanAccessRepo(ctx.db, ctx.userId, repo)) ? repo : null;
  },
});

/** Checks which AI providers (Claude, Codex, Opencode, Cursor) are available for a repo based on configured env vars. */
export const getProviderAvailability = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.object({
    claude: v.boolean(),
    codex: v.boolean(),
    opencode: v.boolean(),
    cursor: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const unavailable = {
      claude: false,
      codex: false,
      opencode: false,
      cursor: false,
    };
    const repo = await ctx.db.get(args.repoId);
    if (!repo) {
      return unavailable;
    }

    if (!(await userCanAccessRepo(ctx.db, ctx.userId, repo))) {
      return unavailable;
    }

    const repoEnvDoc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    const { teamId } = repo;
    const teamEnvDoc = teamId
      ? await ctx.db
          .query("teamEnvVars")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .first()
      : null;

    const keys = new Set<string>();
    for (const entry of teamEnvDoc?.vars ?? []) {
      keys.add(entry.key);
    }
    for (const entry of repoEnvDoc?.vars ?? []) {
      keys.add(entry.key);
    }

    // A user's own provider account makes that provider available even when the
    // team has no key for it — the account's credentials are injected at launch.
    // Each account contributes its provider's canonical auth key.
    const accounts = await ctx.db
      .query("userProviderAccounts")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();
    for (const account of accounts) {
      keys.add(PROVIDER_PRIMARY_AUTH_KEY[account.provider]);
    }

    return getAIProviderAvailability(keys);
  },
});

/** Finds a GitHub repo by owner, name, and optional app name. */
export const getByOwnerAndName = authQuery({
  args: {
    owner: v.string(),
    name: v.string(),
    appName: v.optional(v.string()),
  },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_and_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .collect();

    let repo = args.appName
      ? candidates.find(
          (r) => r.rootDirectory?.split("/").pop() === args.appName,
        )
      : candidates.find((r) => !r.rootDirectory && r.hidden !== true);

    if (!repo && !args.appName) {
      repo = pickDefaultVisibleAppRepo(candidates);
    }

    if (!repo) return null;
    if (repo.hidden === true) return null;
    return (await userCanAccessRepo(ctx.db, ctx.userId, repo)) ? repo : null;
  },
});

/** Returns the team ID associated with a repo (internal use only). */
export const getTeamIdForRepo = internalQuery({
  args: { repoId: v.string() },
  returns: v.union(v.id("teams"), v.null()),
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("githubRepos", args.repoId);
    if (!normalizedId) return null;

    const repo = await ctx.db.get(normalizedId);
    if (!repo) return null;

    return repo.teamId ?? null;
  },
});

/** Lists all non-hidden repos belonging to a specific team. */
export const listByTeam = authQuery({
  args: { teamId: v.id("teams") },
  returns: v.array(githubRepoWithLogoValidator),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) return [];

    const repos = await ctx.db
      .query("githubRepos")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    return await attachLogoUrls(
      ctx.storage,
      repos.filter((r) => r.hidden !== true),
    );
  },
});

/** Internal: all repo ids sharing owner/name (monorepo siblings + self). */
export const listRepoIdsByOwnerAndName = internalQuery({
  args: { owner: v.string(), name: v.string() },
  returns: v.array(v.id("githubRepos")),
  handler: async (ctx, args) => {
    const siblings = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_and_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .collect();
    return siblings.map((repo) => repo._id);
  },
});

/** Lists sibling monorepo sub-apps for a given repo entry. */
export const listSiblingApps = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      _id: v.id("githubRepos"),
      appName: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return [];

    const siblings = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_and_name", (q) =>
        q.eq("owner", repo.owner).eq("name", repo.name),
      )
      .collect();

    return siblings
      .filter((s) => s._id !== args.repoId && s.rootDirectory)
      .map((s) => ({
        _id: s._id,
        appName: s.rootDirectory?.split("/").pop() ?? "",
      }));
  },
});

/** Returns the configured GitHub App slug used to build install/configure URLs. */
export const getAppSlug = authQuery({
  args: {},
  returns: v.string(),
  handler: async () => {
    const slug = process.env.GITHUB_APP_SLUG;
    if (!slug) {
      throw new Error("GITHUB_APP_SLUG is not set in Convex env");
    }
    return slug;
  },
});

/** Gets a GitHub repo by ID without access control (internal use only). */
export const findParentRepoByOwnerAndName = internalQuery({
  args: {
    owner: v.string(),
    name: v.string(),
  },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    const repos = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_and_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .collect();
    const parent = repos.find((repo) => !repo.rootDirectory);
    return parent ?? repos[0] ?? null;
  },
});

/** Gets a GitHub repo by ID without access control (internal use only). */
export const getInternal = internalQuery({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Lists all repos grouped by codebase (owner/name). Each codebase shows root repo + sub-apps. */
export const listGroupedByCodebase = authQuery({
  args: {},
  returns: v.array(
    v.object({
      /** Codebase identifier: "owner/name" */
      codebase: v.string(),
      /** Display name for the codebase */
      displayName: v.string(),
      /** Whether this codebase has multiple apps (monorepo) */
      isMonorepo: v.boolean(),
      /** Apps within this codebase */
      apps: v.array(
        v.object({
          _id: v.id("githubRepos"),
          /** App name (rootDirectory folder name) or repo name if root */
          appName: v.string(),
          /** Full root directory path, null for root repo */
          rootDirectory: v.union(v.string(), v.null()),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const repos = await gatherAccessibleRepos(ctx.db, ctx.userId, false);

    // Group by owner/name
    const codebaseMap = new Map<
      string,
      {
        owner: string;
        name: string;
        apps: Array<{
          _id: (typeof repos)[number]["_id"];
          appName: string;
          rootDirectory: string | null;
        }>;
      }
    >();

    for (const repo of repos) {
      const codebaseKey = `${repo.owner}/${repo.name}`;
      if (!codebaseMap.has(codebaseKey)) {
        codebaseMap.set(codebaseKey, {
          owner: repo.owner,
          name: repo.name,
          apps: [],
        });
      }

      const appName = repo.rootDirectory
        ? (repo.rootDirectory.split("/").pop() ?? repo.name)
        : repo.name;

      codebaseMap.get(codebaseKey)?.apps.push({
        _id: repo._id,
        appName,
        rootDirectory: repo.rootDirectory ?? null,
      });
    }

    // Convert to array and sort
    const result = Array.from(codebaseMap.entries()).map(
      ([codebase, { name, apps }]) => ({
        codebase,
        displayName: name,
        isMonorepo: apps.length > 1,
        apps: apps.sort((a, b) => {
          // Root repo first, then alphabetically by app name
          if (a.rootDirectory === null) return -1;
          if (b.rootDirectory === null) return 1;
          return a.appName.localeCompare(b.appName);
        }),
      }),
    );

    // Sort codebases alphabetically
    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});
