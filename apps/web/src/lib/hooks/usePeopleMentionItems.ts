"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { MentionItem } from "@/lib/components/mentions";

/**
 * Loads the teammates who can be `@`-mentioned in a repo. Shared by every
 * mention surface (chat composers, comment inputs) so the picker offers the
 * same people everywhere and notifications only ever target team members.
 */
export function usePeopleMentionItems(
  repoId: Id<"githubRepos"> | undefined,
): MentionItem<Id<"users">>[] {
  const members = useQuery(
    api.teamMembers.listForRepo,
    repoId ? { repoId } : "skip",
  );
  if (!members) return [];
  return members.flatMap((member) => {
    // Nameless, email-less accounts have nothing to show in the picker.
    const label = member.fullName?.trim() || member.email?.trim();
    if (!label) return [];
    return [
      {
        id: member._id,
        label,
        badge: "Person",
        personUserId: member._id,
      },
    ];
  });
}
