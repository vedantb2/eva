import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type Id } from "@eva/backend";
import {
  type SlashItem,
  systemSkillTokenId,
} from "@/lib/components/mentions";

/**
 * The `/` skill list for a repo: skills synced from `.agents/skills` plus the
 * Eva system skills installed on this repo.
 *
 * The label is what the backend strips a chip down to, so a system skill must
 * be labelled with its raw registry name (`eva-capture`) — that is the name the
 * agent's skill directory carries in the sandbox.
 */
export function useSkillSlashItems(repoId: Id<"githubRepos">): SlashItem[] {
  const repoSkills = useQuery(api.repoSkills.listByRepo, { repoId }) ?? [];
  const systemSkills =
    useQuery(api.repoSystemSkills.listForRepo, { repoId }) ?? [];

  const available = repoSkills.filter((skill) => skill.available);
  const repoItems: SlashItem[] = available.map((skill) => ({
    id: skill._id,
    label: skill.title,
    description: skill.description,
  }));

  // A repo skill of the same name shadows the Eva one — the sandbox
  // materializer leaves user-owned skill directories alone.
  const systemItems: SlashItem[] = systemSkills.flatMap((skill) =>
    skill.installed && !available.some((repo) => repo.title === skill.name)
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
