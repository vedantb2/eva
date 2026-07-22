"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Spinner,
  cn,
} from "@conductor/ui";
import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { AnimatePresence } from "motion/react";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { SidebarSessionRow } from "@/lib/components/sidebar/SidebarSessionRow";
import { SharedLayoutNav } from "@/lib/components/sidebar/SharedLayoutNav";
import {
  repoSessionBasePaths,
  repoSessionsIndexPath,
} from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { entityPathSegment } from "@/lib/numId";
import {
  repoDisplayLabel,
  type RepoWithLogo,
} from "@/lib/utils/repoGrouping";

type SessionListItem = FunctionReturnType<typeof api.sessions.list>[number];

interface GlobalSessionGroupProps {
  repo: RepoWithLogo;
  pathname: string;
  searchQuery: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: () => void;
  onRenameRequest: (session: SessionListItem, repo: RepoWithLogo) => void;
  onArchiveRequest: (session: SessionListItem, repo: RepoWithLogo) => void;
}

/**
 * One collapsible app group in the global Sessions sidebar: logo + title,
 * `+` → that app's sessions composer, rows link to `/$owner/$repo/…/sessions/$numId`.
 */
export function GlobalSessionGroup({
  repo,
  pathname,
  searchQuery,
  open,
  onOpenChange,
  onNavigate,
  onRenameRequest,
  onArchiveRequest,
}: GlobalSessionGroupProps) {
  const navigate = useNavigate();
  const sessions = useQuery(api.sessions.list, { repoId: repo._id });
  const createSession = useMutation(api.sessions.create);
  const label = repoDisplayLabel(repo);
  const baseUrl = `${repoSessionBasePaths(repo)[0]}/sessions`;
  const query = searchQuery.trim().toLowerCase();
  const filtered =
    sessions === undefined
      ? undefined
      : query.length === 0
        ? sessions
        : sessions.filter((s) => s.title.toLowerCase().includes(query));

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
                <span className="flex size-[18px] items-center justify-center rounded-sm bg-muted text-[10px] font-semibold text-muted-foreground">
                  {label.charAt(0).toUpperCase()}
                </span>
              }
            />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-sidebar-foreground">
              {label}
            </span>
            <IconChevronDown
              size={14}
              className={cn(
                "shrink-0 text-muted-foreground transition-transform duration-200",
                !open && "-rotate-90",
              )}
            />
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
          <IconPlus size={14} />
        </button>
      </div>
      <CollapsibleContent>
        <div className="pb-1 pl-1">
          {filtered === undefined ? (
            <div className="flex items-center justify-center py-3">
              <Spinner size="sm" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {sessions !== undefined && sessions.length === 0
                ? "No sessions yet"
                : "No matches"}
            </p>
          ) : (
            <SharedLayoutNav
              layoutId={`global-sessions-${repo._id}`}
              className="space-y-1"
            >
              <AnimatePresence initial={false}>
                {filtered.map((session) => {
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
            </SharedLayoutNav>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
