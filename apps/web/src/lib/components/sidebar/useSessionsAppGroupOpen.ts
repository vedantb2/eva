"use client";

import { useLocalStorage } from "usehooks-ts";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@eva/backend";
import { repoMatchesPath } from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { SESSIONS_APP_GROUPS_OPEN_KEY } from "@/lib/components/sidebar/_utils/sessionsSidebarSettings";

type RepoRow = FunctionReturnType<typeof api.githubRepos.list>[number];

function parseOpenByRepoId(value: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [key, open] of Object.entries(value)) {
    if (typeof open === "boolean") out[key] = open;
  }
  return out;
}

/** Persisted expand/collapse for app groups in global Sessions views. */
export function useSessionsAppGroupOpen(pathname: string) {
  const [openByRepoId, setOpenByRepoId] = useLocalStorage<Record<string, boolean>>(
    SESSIONS_APP_GROUPS_OPEN_KEY,
    {},
  );

  const isGroupOpen = (repo: RepoRow): boolean => {
    const stored = parseOpenByRepoId(openByRepoId)[repo._id];
    if (stored !== undefined) return stored;
    // Default: collapsed unless this app owns the active session URL.
    return repoMatchesPath(repo, pathname) && pathname.includes("/sessions");
  };

  const setGroupOpen = (repoId: string, open: boolean) => {
    setOpenByRepoId((prev) => ({
      ...parseOpenByRepoId(prev),
      [repoId]: open,
    }));
  };

  return { isGroupOpen, setGroupOpen };
}
