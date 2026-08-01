"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Spinner,
  cn,
} from "@eva/ui";
import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { AnimatePresence } from "motion/react";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { ArchivedSessionsCollapsible } from "@/lib/components/sidebar/_components/ArchivedSessionsCollapsible";
import { SessionListShowMore } from "@/lib/components/sidebar/_components/SessionListShowMore";
import { SidebarSessionRow } from "@/lib/components/sidebar/SidebarSessionRow";
import { SharedLayoutNav } from "@/lib/components/sidebar/SharedLayoutNav";
import {
  repoSessionBasePaths,
  repoSessionsIndexPath,
} from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { previewSessions } from "@/lib/components/sidebar/_utils/sessionListPreview";
import {
  sortSessionsForSidebar,
  type SessionSortOrder,
} from "@/lib/components/sidebar/_utils/sessionsSidebarSettings";
import { entityPathSegment } from "@/lib/numId";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";
import { isSessionSidebarActive } from "@/routes/_repo/$owner/$repo/sessions/_utils/sessionReadOnly";

type SessionListItem = FunctionReturnType<typeof api.sessions.list>[number];

interface GlobalSessionGroupProps {
  repo: RepoWithLogo;
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: () => void;
  onRenameRequest: (session: SessionListItem, repo: RepoWithLogo) => void;
  onArchiveRequest: (session: SessionListItem, repo: RepoWithLogo) => void;
  sessionSortOrder: SessionSortOrder;
  sessionPreviewCount: number;
}

/**
 * One collapsible app group in the global Sessions sidebar: logo + title,
 * `+` → that app's sessions composer, non-archived rows (capped with Show more),
 * then manually Archived (default collapsed).
 */
export function GlobalSessionGroup({
  repo,
  pathname,
  open,
  onOpenChange,
  onNavigate,
  onRenameRequest,
  onArchiveRequest,
  sessionSortOrder,
  sessionPreviewCount,
}: GlobalSessionGroupProps) {
  const navigate = useNavigate();
  const [isActiveListExpanded, setIsActiveListExpanded] = useState(false);
  const sessions = useQuery(api.sessions.list, { repoId: repo._id });
  const archivedSessions = useQuery(api.sessions.listArchived, {
    repoId: repo._id,
  });
  const createSession = useMutation(api.sessions.create);
  const unarchiveSession = useMutation(api.sessions.unarchive);
  const label = repoDisplayLabel(repo);
  const baseUrl = `${repoSessionBasePaths(repo)[0]}/sessions`;

  // Main list = every non-archived session (including merged/closed PRs).
  // Archived collapsible = manually archived only.
  const nonArchivedSessions = sessions;
  const isLoading =
    nonArchivedSessions === undefined || archivedSessions === undefined;
  const mainSessions = sortSessionsForSidebar(
    nonArchivedSessions ?? [],
    sessionSortOrder,
  );
  const archivedGroup = sortSessionsForSidebar(
    archivedSessions ?? [],
    sessionSortOrder,
  );
  const mainCount = mainSessions.length;
  const selectedSessionId =
    mainSessions.find((session) => {
      const pathSegment = entityPathSegment(session);
      if (!pathSegment) return false;
      const href = `${baseUrl}/${pathSegment}`;
      return pathname === href || pathname.startsWith(`${href}/`);
    })?._id ?? null;
  const {
    visible: visibleMainSessions,
    hasOverflow: hasMainOverflow,
    hiddenCount: hiddenMainCount,
  } = previewSessions(mainSessions, {
    expanded: isActiveListExpanded,
    selectedId: selectedSessionId,
    limit: sessionPreviewCount,
  });
  // Live sandbox badge: only count non-archived sessions that are running.
  const runningCount =
    nonArchivedSessions?.filter(
      (s) => s.status === "active" && isSessionSidebarActive(s),
    ).length ?? 0;
  const archivedCount = archivedGroup.length;
  const hasNoResults = !isLoading && mainCount === 0 && archivedCount === 0;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-0.5 px-1">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-menu-item px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/50"
          >
            <RepoLogo
              logoUrl={repo.logoUrl}
              size={18}
              fallback={
                <span className="flex size-[18px] items-center justify-center rounded-sm bg-muted text-3xs font-semibold text-muted-foreground">
                  {label.charAt(0).toUpperCase()}
                </span>
              }
            />
            <span className="flex min-w-0 items-center gap-1">
              <span className="truncate text-xs font-medium text-muted-foreground">
                {label}
              </span>
              {runningCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="shrink-0 gap-1 border-none bg-sidebar-accent/50 px-1.5 py-0"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="text-2xs font-medium text-muted-foreground tabular-nums">
                    {runningCount}
                  </span>
                </Badge>
              ) : null}
              <IconChevronDown
                className={cn(
                  "size-3.5",
                  "shrink-0 text-muted-foreground transition-transform duration-200",
                  !open && "-rotate-90",
                )}
              />
            </span>
          </button>
        </CollapsibleTrigger>
        <button
          type="button"
          aria-label={`New session in ${label}`}
          title={`New session in ${label}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-menu-item text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate({ to: repoSessionsIndexPath(repo) });
            onNavigate?.();
          }}
        >
          <IconPlus className="size-3.5" />
        </button>
      </div>
      <CollapsibleContent>
        <div className="pb-1 pl-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-3">
              <Spinner size="sm" />
            </div>
          ) : hasNoResults ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {sessions !== undefined &&
              sessions.length === 0 &&
              (archivedSessions?.length ?? 0) === 0
                ? "No sessions yet"
                : "No matches"}
            </p>
          ) : (
            <SharedLayoutNav
              layoutId={`global-sessions-${repo._id}`}
              className="space-y-1"
            >
              <AnimatePresence initial={false}>
                {visibleMainSessions.map((session) => {
                  const pathSegment = entityPathSegment(session);
                  const href = pathSegment
                    ? `${baseUrl}/${pathSegment}`
                    : baseUrl;
                  const isSelected =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <SidebarSessionRow
                      key={session._id}
                      session={session}
                      isSelected={isSelected}
                      baseUrl={baseUrl}
                      onNavigate={onNavigate}
                      onRename={async () => {}}
                      onDuplicate={async (s) => {
                        const { numId } = await createSession({
                          repoId: repo._id,
                          title: `${s.title} (copy)`,
                        });
                        return String(numId);
                      }}
                      onRenameRequest={(s) => onRenameRequest(s, repo)}
                      onArchiveRequest={(s) => onArchiveRequest(s, repo)}
                      onDuplicateNavigate={(segment) => {
                        navigate({ to: `${baseUrl}/${segment}` });
                        onNavigate?.();
                      }}
                    />
                  );
                })}
              </AnimatePresence>
              {hasMainOverflow ? (
                <SessionListShowMore
                  expanded={isActiveListExpanded}
                  hiddenCount={hiddenMainCount}
                  onToggle={() => setIsActiveListExpanded((prev) => !prev)}
                />
              ) : null}
              {archivedCount > 0 ? (
                <ArchivedSessionsCollapsible
                  sessions={archivedGroup}
                  baseUrl={baseUrl}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  itemIdPrefix={`global-archived-${repo._id}`}
                  onUnarchive={async (session) => {
                    if (session.archived !== true) return;
                    await unarchiveSession({ id: session._id });
                  }}
                />
              ) : null}
            </SharedLayoutNav>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
