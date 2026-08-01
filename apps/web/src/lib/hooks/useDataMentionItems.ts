import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { MentionItem } from "@/lib/components/mentions";

/** Loads Data `@` mention candidates (docs, sessions, projects, quick tasks). */
export function useDataMentionItems(
  repoId: Id<"githubRepos"> | undefined,
): MentionItem[] {
  const data = useQuery(api.mentions.listData, repoId ? { repoId } : "skip");
  if (!data) return [];
  return data.map((item) => ({
    id: item.id,
    label: item.label,
    badge: item.badge,
    ...(item.description !== undefined
      ? { description: item.description }
      : {}),
  }));
}
