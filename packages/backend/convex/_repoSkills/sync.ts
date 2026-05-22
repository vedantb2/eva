"use node";

import type { Octokit } from "octokit";
import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import { action } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getInstallationOctokit } from "../githubAuth";

const SKILLS_ROOT_PATH = ".agents/skills";
const SKILL_FILE_NAME = "SKILL.md";

type SkillDirectory = {
  path: string;
  fallbackTitle: string;
};

type ParsedSkill = {
  title: string;
  description: string;
};

type SyncedSkill = ParsedSkill & {
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

type BlockParseResult = {
  value: string;
  nextIndex: number;
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

function parseScalarValue(raw: string): string {
  const value = raw.trim();
  if (
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) &&
    value.length >= 2
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function parseIndentedBlock(
  lines: string[],
  startIndex: number,
): BlockParseResult {
  const parts: string[] = [];
  let nextIndex = startIndex;
  while (nextIndex < lines.length) {
    const line = lines[nextIndex] ?? "";
    if (line.trim() === "") {
      parts.push("");
      nextIndex++;
      continue;
    }
    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      break;
    }
    parts.push(line.trim());
    nextIndex++;
  }

  return {
    value: parts.join(" ").replace(/\s+/g, " ").trim(),
    nextIndex,
  };
}

function getFrontmatterLines(markdown: string): string[] | null {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") return null;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      return lines.slice(1, i);
    }
  }

  return null;
}

function parseSkillMarkdown(
  markdown: string,
  fallbackTitle: string,
): ParsedSkill | null {
  const frontmatterLines = getFrontmatterLines(markdown);
  if (!frontmatterLines) return null;

  let title = fallbackTitle;
  let description = "";

  for (let i = 0; i < frontmatterLines.length; i++) {
    const line = frontmatterLines[i] ?? "";
    if (line.startsWith("name:")) {
      title = parseScalarValue(line.slice("name:".length));
      continue;
    }
    if (line.startsWith("description:")) {
      const rawDescription = line.slice("description:".length).trim();
      if (rawDescription.startsWith(">") || rawDescription.startsWith("|")) {
        const block = parseIndentedBlock(frontmatterLines, i + 1);
        description = block.value;
        i = block.nextIndex - 1;
      } else {
        description = parseScalarValue(rawDescription);
      }
    }
  }

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  if (!trimmedTitle || !trimmedDescription) return null;

  return {
    title: trimmedTitle,
    description: trimmedDescription,
  };
}

function decodeGitHubContent(content: string): string {
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
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
): Promise<SyncedSkill | null> {
  const sourcePath = `${directory.path}/${SKILL_FILE_NAME}`;
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo: name,
      path: sourcePath,
      ref,
    });

    if (Array.isArray(response.data)) return null;
    if (response.data.type !== "file") return null;
    if (
      !("content" in response.data) ||
      typeof response.data.content !== "string"
    ) {
      return null;
    }
    if (!("sha" in response.data) || typeof response.data.sha !== "string") {
      return null;
    }

    const parsed = parseSkillMarkdown(
      decodeGitHubContent(response.data.content),
      directory.fallbackTitle,
    );
    if (!parsed) return null;

    return {
      title: parsed.title,
      description: parsed.description,
      sourcePath,
      sourceSha: response.data.sha,
    };
  } catch (error) {
    if (error instanceof Error && isGithubNotFound(error)) {
      return null;
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
      const skill = await fetchSkill(
        octokit,
        target.owner,
        target.name,
        target.ref,
        directory,
      );
      if (!skill) {
        skipped++;
        warnings.push(
          `Skipped ${directory.path}: missing valid ${SKILL_FILE_NAME}.`,
        );
        continue;
      }
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
