"use client";

import { useQueries } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { useMemo, useState } from "react";
import {
  sessionActivityAt,
  sortAppsForSidebar,
  sortSessionsForSidebar,
} from "@/lib/components/sidebar/_utils/sessionsSidebarSettings";
import { useSessionsSidebarSettings } from "@/lib/components/sidebar/useSessionsSidebarSettings";
import { SessionChromeTabGroup } from "@/lib/components/sidebar/session-tabs/SessionChromeTabGroup";
import {
  SessionTabsArchivedMenu,
  type ArchivedMenuGroup,
} from "@/lib/components/sidebar/session-tabs/SessionTabsArchivedMenu";
import {
  SessionTabsDialogs,
  type SessionArchiveTarget,
  type SessionRenameTarget,
} from "@/lib/components/sidebar/session-tabs/SessionTabsDialogs";
import {
  SessionTabsOverflowMenu,
  type OverflowGroup,
} from "@/lib/components/sidebar/session-tabs/SessionTabsOverflowMenu";
import { partitionSessionsForChromeTabs } from "@/lib/components/sidebar/session-tabs/sessionTabsPartition";
import { entityPathSegment } from "@/lib/numId";

type SessionListItem = FunctionReturnType<typeof api.sessions.list>[number];
type ArchivedListItem = FunctionReturnType<
  typeof api.sessions.listArchived
>[number];
type RepoRow = FunctionReturnType<typeof api.githubRepos.list>[number];

interface SessionChromeTabsBarProps {
  pathname: string;
}

/**
 * Chrome-style horizontal session tabs: repo groups of active sessions, plus
 * overflow (full active list) and Archived (archived ∪ merged/closed) menus.
 */
export function SessionChromeTabsBar({ pathname }: SessionChromeTabsBarProps) {
  const { settings } = useSessionsSidebarSettings();
  const repos = useQuery(api.githubRepos.list, {});
  const [sessionToRename, setSessionToRename] =
    useState<SessionRenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [sessionToArchive, setSessionToArchive] =
    useState<SessionArchiveTarget | null>(null);

  const sessionListQueries = useMemo(() => {
    if (repos === undefined) return {};
    return Object.fromEntries(
      repos.map((repo) => [
        repo._id,
        {
          query: api.sessions.list,
          args: { repoId: repo._id },
        },
      ]),
    );
  }, [repos]);
  const archivedListQueries = useMemo(() => {
    if (repos === undefined) return {};
    return Object.fromEntries(
      repos.map((repo) => [
        repo._id,
        {
          query: api.sessions.listArchived,
          args: { repoId: repo._id },
        },
      ]),
    );
  }, [repos]);
  const sessionsByRepoId = useQueries(sessionListQueries);
  const archivedByRepoId = useQueries(archivedListQueries);

  const latestActivityByAppId = new Map<string, number>();
  for (const [repoId, result] of Object.entries(sessionsByRepoId)) {
    if (result === undefined || result instanceof Error) continue;
    let latest = 0;
    for (const session of result) {
      const at = sessionActivityAt(session);
      if (at > latest) latest = at;
    }
    if (latest > 0) latestActivityByAppId.set(repoId, latest);
  }

  const orderedRepos =
    repos === undefined
      ? undefined
      : sortAppsForSidebar(repos, settings.appSortOrder, latestActivityByAppId);

  const overflowGroups: OverflowGroup[] = [];
  const archivedGroups: ArchivedMenuGroup[] = [];
  if (orderedRepos) {
    for (const repo of orderedRepos) {
      const listed = sessionsByRepoId[repo._id];
      const archived = archivedByRepoId[repo._id];
      if (
        listed === undefined ||
        listed instanceof Error ||
        archived === undefined ||
        archived instanceof Error
      ) {
        continue;
      }
      const { active, archivedMenu } = partitionSessionsForChromeTabs<
        SessionListItem,
        ArchivedListItem
      >(listed, archived);
      overflowGroups.push({
        repo,
        sessions: sortSessionsForSidebar(active, settings.sessionSortOrder),
      });
      archivedGroups.push({
        repo,
        sessions: sortSessionsForSidebar(
          archivedMenu,
          settings.sessionSortOrder,
        ),
      });
    }
  }

  return (
    <>
      <div className="flex h-11 shrink-0 items-end border-b border-border bg-muted/40">
        <div className="scrollbar flex min-w-0 flex-1 items-end overflow-x-auto px-1 pt-1">
          {orderedRepos === undefined ? (
            <div
              className="flex items-center gap-2 px-3 pb-2"
              aria-busy="true"
              aria-label="Loading session tabs"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-40 animate-pulse rounded-t-lg bg-muted/70"
                />
              ))}
            </div>
          ) : orderedRepos.length === 0 ? (
            <p className="flex items-center px-3 pb-2 text-sm text-muted-foreground">
              No apps yet
            </p>
          ) : (
            orderedRepos.map((repo: RepoRow) => (
              <SessionChromeTabGroup
                key={repo._id}
                repo={repo}
                pathname={pathname}
                hideWhenEmpty
                onRenameRequest={(session, groupRepo) => {
                  setSessionToRename({ session, repo: groupRepo });
                  setRenameValue(session.title);
                }}
                onArchiveRequest={(session, groupRepo) => {
                  const pathSegment = entityPathSegment(session);
                  if (!pathSegment) return;
                  setSessionToArchive({
                    session,
                    repo: groupRepo,
                    pathSegment,
                  });
                }}
              />
            ))
          )}
        </div>
        <div className="mb-0 flex h-11 shrink-0 items-stretch self-stretch border-l border-border bg-background/40">
          <SessionTabsOverflowMenu
            groups={overflowGroups}
            allRepos={orderedRepos ?? []}
            pathname={pathname}
          />
          <SessionTabsArchivedMenu
            groups={archivedGroups}
            pathname={pathname}
          />
        </div>
      </div>

      <SessionTabsDialogs
        pathname={pathname}
        renameTarget={sessionToRename}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onCloseRename={() => setSessionToRename(null)}
        archiveTarget={sessionToArchive}
        onCloseArchive={() => setSessionToArchive(null)}
      />
    </>
  );
}
