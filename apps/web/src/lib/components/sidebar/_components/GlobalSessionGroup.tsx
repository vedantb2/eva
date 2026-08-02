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
  type SessionListMode,
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
  listMode: SessionListMode;
}

/**
 * One collapsible app group in the global Sessions sidebar: logo + title,
 * `+` → that app's sessions composer, then Active or Archived rows for the
 * current list mode (capped with Show more).
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
  listMode,
}: GlobalSessionGroupProps) {
  const navigate = useNavigate();
  const [isListExpanded, setIsListExpanded] = useState(false);
  const activeSessions = useQuery(
    api.sessions.list,
    listMode === "active" ? { repoId: repo._id } : "skip",
  );
  const archivedSessions = useQuery(
    api.sessions.listArchived,
    listMode === "archived" ? { repoId: repo._id } : "skip",
  );
  const createSession = useMutation(api.sessions.create);
  const unarchiveSession = useMutation(api.sessions.unarchive);
  const label = repoDisplayLabel(repo);
  const baseUrl = `${repoSessionBasePaths(repo)[0]}/sessions`;

  const sourceSessions =
    listMode === "archived" ? archivedSessions : activeSessions;
  const isLoading = sourceSessions === undefined;
  const sortedSessions = sortSessionsForSidebar(
    sourceSessions ?? [],
    sessionSortOrder,
  );
  const selectedSessionId =
    sortedSessions.find((session) => {
      const pathSegment = entityPathSegment(session);
      if (!pathSegment) return false;
      const href = `${baseUrl}/${pathSegment}`;
      return pathname === href || pathname.startsWith(`${href}/`);
    })?._id ?? null;
  const {
    visible: visibleSessions,
    hasOverflow,
    hiddenCount,
  } = previewSessions(sortedSessions, {
    expanded: isListExpanded,
    selectedId: selectedSessionId,
    limit: sessionPreviewCount,
  });
  const runningCount =
    activeSessions?.filter(
      (s) => s.status === "active" && isSessionSidebarActive(s),
    ).length ?? 0;
  const hasNoResults = !isLoading && sortedSessions.length === 0;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-0.5 px-1">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/50"
          >
            <RepoLogo
              logoUrl={repo.logoUrl}
              size={18}
              fallback={
                <span className="flex size-[18px] items-center justify-center rounded-sm border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
                  {label.charAt(0).toUpperCase()}
                </span>
              }
            />
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs font-medium text-muted-foreground">
                {label}
              </span>
              {listMode === "active" && runningCount > 0 ? (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 border-border bg-transparent px-1.5 py-0"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {runningCount}
                  </span>
                </Badge>
              ) : null}
              <IconChevronDown
                size={14}
                className={cn(
                  "shrink-0 text-muted-foreground transition-transform duration-200",
                  !open && "-rotate-90",
                )}
              />
            </span>
          </button>
        </CollapsibleTrigger>
        {listMode === "active" ? (
          <button
            type="button"
            aria-label={`New session in ${label}`}
            title={`New session in ${label}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate({ to: repoSessionsIndexPath(repo) });
              onNavigate?.();
            }}
          >
            <IconPlus size={14} />
          </button>
        ) : null}
      </div>
      <CollapsibleContent>
        <div className="pb-1 pl-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-3">
              <Spinner size="sm" />
            </div>
          ) : hasNoResults ? (
            <div className="px-3 py-3 text-center">
              <p className="text-xs font-medium text-foreground">
                {listMode === "archived"
                  ? "No archived sessions"
                  : "No sessions yet"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {listMode === "archived"
                  ? "Archive a thread from its menu."
                  : "Press + to start one."}
              </p>
            </div>
          ) : (
            <SharedLayoutNav
              layoutId={`global-sessions-${repo._id}-${listMode}`}
              className="space-y-1"
            >
              <AnimatePresence initial={false}>
                {visibleSessions.map((session) => {
                  const pathSegment = entityPathSegment(session);
                  const href = pathSegment
                    ? `${baseUrl}/${pathSegment}`
                    : baseUrl;
                  const isSelected =
                    pathname === href || pathname.startsWith(`${href}/`);
                  if (listMode === "archived") {
                    return (
                      <SidebarSessionRow
                        key={session._id}
                        session={session}
                        isSelected={isSelected}
                        baseUrl={baseUrl}
                        onNavigate={onNavigate}
                        onUnarchive={async (s) => {
                          await unarchiveSession({ id: s._id });
                        }}
                      />
                    );
                  }
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
              {hasOverflow ? (
                <SessionListShowMore
                  expanded={isListExpanded}
                  hiddenCount={hiddenCount}
                  onToggle={() => setIsListExpanded((prev) => !prev)}
                />
              ) : null}
            </SharedLayoutNav>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
