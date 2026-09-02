"use client";

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
    // Drives the picker's leading icon. Assigning the backend union here is the
    // guard: a new kind there fails to compile until it gets an icon.
    kind: item.kind,
    ...(item.description !== undefined
      ? { description: item.description }
      : {}),
  }));
}
