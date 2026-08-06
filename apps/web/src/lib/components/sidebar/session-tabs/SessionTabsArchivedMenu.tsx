"use client";

import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  cn,
} from "@eva/ui";
import { IconArchive, IconArchiveOff } from "@tabler/icons-react";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { repoSessionBasePaths } from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { entityPathSegment } from "@/lib/numId";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";

export interface ArchivedMenuSession {
  _id: Id<"sessions">;
  numId?: number;
  title: string;
  archived?: boolean;
  prState?: "draft" | "open" | "merged" | "closed";
  updatedAt?: number;
  _creationTime: number;
}

export interface ArchivedMenuGroup {
  repo: RepoWithLogo;
  sessions: ArchivedMenuSession[];
}

interface SessionTabsArchivedMenuProps {
  groups: ArchivedMenuGroup[];
  pathname: string;
}

/**
 * Archived button: manually archived sessions plus PR merged/closed fold-ins.
 * Unarchive only applies to manually archived rows.
 */
export function SessionTabsArchivedMenu({
  groups,
  pathname,
}: SessionTabsArchivedMenuProps) {
  const unarchiveSession = useMutation(api.sessions.unarchive);
  const nonEmpty = groups.filter((g) => g.sessions.length > 0);
  const total = nonEmpty.reduce((sum, g) => sum + g.sessions.length, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Archived sessions"
          aria-label="Archived sessions"
          className="flex h-full shrink-0 items-center gap-2 border-l border-border px-3.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground"
        >
          <IconArchive size={14} />
          <span className="tabular-nums">{total}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-56 overflow-y-auto"
      >
        {nonEmpty.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
            No archived sessions
          </p>
        ) : (
          nonEmpty.map((group) => {
            const label = repoDisplayLabel(group.repo);
            const baseUrl = `${repoSessionBasePaths(group.repo)[0]}/sessions`;
            return (
              <DropdownMenuSub key={group.repo._id}>
                <DropdownMenuSubTrigger>
                  <RepoLogo
                    logoUrl={group.repo.logoUrl}
                    size={16}
                    fallback={
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-muted text-[9px] font-semibold text-muted-foreground">
                        {label.charAt(0).toUpperCase()}
                      </span>
                    }
                  />
                  <span className="truncate">{label}</span>
                  <span className="tabular-nums text-[10px] text-muted-foreground">
                    {group.sessions.length}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 w-72 overflow-y-auto">
                  {group.sessions.map((session) => {
                    const pathSegment = entityPathSegment(session);
                    const href = pathSegment
                      ? `${baseUrl}/${pathSegment}`
                      : baseUrl;
                    const isSelected =
                      pathname === href || pathname.startsWith(`${href}/`);
                    const canUnarchive = session.archived === true;
                    const subtitle =
                      session.prState === "merged"
                        ? "Merged"
                        : session.prState === "closed"
                          ? "Closed"
                          : "Archived";
                    return (
                      <div
                        key={session._id}
                        className="flex items-center gap-0.5 pr-1"
                      >
                        <DropdownMenuItem asChild className="min-w-0 flex-1">
                          <DynamicLink
                            to={href}
                            className={cn(
                              "cursor-pointer",
                              isSelected && "bg-accent",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {session.title}
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {subtitle}
                            </span>
                          </DynamicLink>
                        </DropdownMenuItem>
                        {canUnarchive ? (
                          <button
                            type="button"
                            title="Unarchive"
                            aria-label={`Unarchive ${session.title}`}
                            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => {
                              void unarchiveSession({ id: session._id });
                            }}
                          >
                            <IconArchiveOff size={14} />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
