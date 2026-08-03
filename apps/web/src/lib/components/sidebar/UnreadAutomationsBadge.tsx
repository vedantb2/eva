import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { SidebarCountBadge } from "@/lib/components/sidebar/_components/SidebarCountBadge";

export function UnreadAutomationsBadge({
  repoId,
}: {
  repoId: Id<"githubRepos">;
}) {
  const count = useQuery(api.automations.countUnreadByRepo, { repoId });

  if (!count) {
    return null;
  }

  return <SidebarCountBadge count={count} />;
}
