import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type AIProvider, type Id } from "@eva/backend";
import { type SlashItem, systemSkillTokenId } from "@/lib/components/mentions";

/**
 * The `/` skill list for a repo: skills synced from `.agents/skills` plus the
 * Eva system skills installed on this repo.
 *
 * The label is what the backend strips a chip down to, so a system skill must
 * be labelled with its raw registry name (`eva-capture`) — that is the name the
 * agent's skill directory carries in the sandbox.
 */
export function isClaudeSkillSourcePath(
  sourcePath: string | undefined,
): boolean {
  return sourcePath?.startsWith(".claude/skills/") === true;
}

interface RepoSkillCandidate {
  title: string;
  sourcePath?: string;
  available: boolean;
}

export function selectRepoSkillsForProvider<TSkill extends RepoSkillCandidate>(
  skills: ReadonlyArray<TSkill>,
  provider: AIProvider | undefined,
): TSkill[] {
  const available = skills.filter((skill) => skill.available);
  const genericTitles = new Set(
    available
      .filter((skill) => !isClaudeSkillSourcePath(skill.sourcePath))
      .map((skill) => skill.title),
  );
  const claudeTitles = new Set(
    available
      .filter((skill) => isClaudeSkillSourcePath(skill.sourcePath))
      .map((skill) => skill.title),
  );

  return available.filter((skill) => {
    const claudeOnly = isClaudeSkillSourcePath(skill.sourcePath);
    if (provider === "claude") {
      return claudeOnly || !claudeTitles.has(skill.title);
    }
    if (provider !== undefined) return !claudeOnly;
    return !claudeOnly || !genericTitles.has(skill.title);
  });
}

export function useSkillSlashItems(
  repoId: Id<"githubRepos">,
  provider?: AIProvider,
): SlashItem[] {
  const repoSkills = useQuery(api.repoSkills.listByRepo, { repoId }) ?? [];
  const systemSkills =
    useQuery(api.repoSystemSkills.listForRepo, { repoId }) ?? [];

  const selectedRepoSkills = selectRepoSkillsForProvider(repoSkills, provider);
  const repoItems: SlashItem[] = selectedRepoSkills.map((skill) => ({
    id: skill._id,
    label: skill.title,
    description: skill.description,
    ...(isClaudeSkillSourcePath(skill.sourcePath) ? { badge: "Claude" } : {}),
  }));

  // A repo skill of the same name shadows the Eva one — the sandbox
  // materializer leaves user-owned skill directories alone.
  const systemItems: SlashItem[] = systemSkills.flatMap((skill) =>
    skill.installed &&
    !selectedRepoSkills.some((repo) => repo.title === skill.name)
      ? [
          {
            id: systemSkillTokenId(skill.name),
            label: skill.name,
            description: skill.description,
            badge: "Eva",
          },
        ]
      : [],
  );

  return [...systemItems, ...repoItems];
}
