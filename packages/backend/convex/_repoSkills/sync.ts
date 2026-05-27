"use node";

import type { Octokit } from "octokit";
import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import { action } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getInstallationOctokit } from "../githubAuth";
import {
  formatSkillSkipWarning,
  parseSkillMarkdown,
  SKILL_FILE_NAME,
} from "./skillMarkdown";

const SKILLS_ROOT_PATH = ".agents/skills";

type SkillDirectory = {
  path: string;
  fallbackTitle: string;
};

type SyncedSkill = {
  title: string;
  description: string;
  sourcePath: string;
  sourceSha: string;
};

type SyncTarget = {
  canonicalRepoId: Id<"githubRepos">;
  owner: string;
  name: string;
  installationId: number;
  ref: string;
};

type SyncResult = {
  synced: number;
  available: number;
  stale: number;
};

const getUserIdFromIdentityRef = makeFunctionReference<
  "query",
  Record<string, never>,
  Id<"users"> | null
>("auth:getUserIdFromIdentity");

const getSyncTargetRef = makeFunctionReference<
  "query",
  { repoId: Id<"githubRepos">; userId: Id<"users"> },
  SyncTarget
>("repoSkills:getSyncTarget");

const applyGithubSyncRef = makeFunctionReference<
  "mutation",
  {
    repoId: Id<"githubRepos">;
    skills: SyncedSkill[];
    syncedAt: number;
  },
  SyncResult
>("repoSkills:applyGithubSync");

function isGithubNotFound(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes("not found") || message.includes("404");
}

function decodeGitHubContent(content: string): string {
  const binary = atob(content.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

async function fetchSkillDirectories(
  octokit: Octokit,
  owner: string,
  name: string,
  ref: string,
): Promise<SkillDirectory[] | null> {
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo: name,
      path: SKILLS_ROOT_PATH,
      ref,
    });

    if (!Array.isArray(response.data)) return [];

    return response.data
      .filter((entry) => entry.type === "dir")
      .flatMap((entry) => {
        if (typeof entry.path !== "string" || typeof entry.name !== "string") {
          return [];
        }
        return [{ path: entry.path, fallbackTitle: entry.name }];
      })
      .sort((a, b) => a.path.localeCompare(b.path));
  } catch (error) {
    if (error instanceof Error && isGithubNotFound(error)) {
      return null;
    }
    throw error;
  }
}

async function fetchSkill(
  octokit: Octokit,
  owner: string,
  name: string,
  ref: string,
  directory: SkillDirectory,
): Promise<{ ok: true; skill: SyncedSkill } | { ok: false; warning: string }> {
  const sourcePath = `${directory.path}/${SKILL_FILE_NAME}`;
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo: name,
      path: sourcePath,
      ref,
    });

    if (Array.isArray(response.data)) {
      return {
        ok: false,
        warning: formatSkillSkipWarning(directory.path, "missing_file"),
      };
    }
    if (response.data.type !== "file") {
      return {
        ok: false,
        warning: formatSkillSkipWarning(directory.path, "missing_file"),
      };
    }
    if (
      !("content" in response.data) ||
      typeof response.data.content !== "string"
    ) {
      return {
        ok: false,
        warning: formatSkillSkipWarning(directory.path, "missing_file"),
      };
    }
    if (!("sha" in response.data) || typeof response.data.sha !== "string") {
      return {
        ok: false,
        warning: formatSkillSkipWarning(directory.path, "missing_file"),
      };
    }

    const parsed = parseSkillMarkdown(
      decodeGitHubContent(response.data.content),
      directory.fallbackTitle,
    );
    if (!parsed.ok) {
      return {
        ok: false,
        warning: formatSkillSkipWarning(directory.path, parsed.reason),
      };
    }

    return {
      ok: true,
      skill: {
        title: parsed.skill.title,
        description: parsed.skill.description,
        sourcePath,
        sourceSha: response.data.sha,
      },
    };
  } catch (error) {
    if (error instanceof Error && isGithubNotFound(error)) {
      return {
        ok: false,
        warning: formatSkillSkipWarning(directory.path, "missing_file"),
      };
    }
    throw error;
  }
}

export const syncFromGithub = action({
  args: { repoId: v.id("githubRepos") },
  returns: v.object({
    synced: v.number(),
    available: v.number(),
    stale: v.number(),
    skipped: v.number(),
    warnings: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await ctx.runQuery(getUserIdFromIdentityRef, {});
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const target = await ctx.runQuery(getSyncTargetRef, {
      repoId: args.repoId,
      userId,
    });
    const octokit = await getInstallationOctokit(target.installationId);
    const directories = await fetchSkillDirectories(
      octokit,
      target.owner,
      target.name,
      target.ref,
    );

    const warnings: string[] = [];
    let skipped = 0;

    if (directories === null) {
      warnings.push(
        `No ${SKILLS_ROOT_PATH} directory found on ${target.ref}. Existing skills were marked stale.`,
      );
      const result = await ctx.runMutation(applyGithubSyncRef, {
        repoId: target.canonicalRepoId,
        skills: [],
        syncedAt: Date.now(),
      });
      return { ...result, skipped, warnings };
    }

    const skills: SyncedSkill[] = [];
    const seenTitles = new Set<string>();
    for (const directory of directories) {
      const fetchResult = await fetchSkill(
        octokit,
        target.owner,
        target.name,
        target.ref,
        directory,
      );
      if (!fetchResult.ok) {
        skipped++;
        warnings.push(fetchResult.warning);
        continue;
      }
      const skill = fetchResult.skill;
      if (seenTitles.has(skill.title)) {
        skipped++;
        warnings.push(
          `Skipped ${skill.sourcePath}: duplicate skill name "${skill.title}".`,
        );
        continue;
      }
      seenTitles.add(skill.title);
      skills.push(skill);
    }

    const result = await ctx.runMutation(applyGithubSyncRef, {
      repoId: target.canonicalRepoId,
      skills,
      syncedAt: Date.now(),
    });
    return { ...result, skipped, warnings };
  },
});
