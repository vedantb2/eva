"use client";

import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from "@eva/ui";
import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { DynamicLink } from "@/lib/components/DynamicLink";
import {
  repoSessionBasePaths,
  repoSessionsIndexPath,
} from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { entityPathSegment } from "@/lib/numId";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";

export interface OverflowSession {
  _id: string;
  numId?: number;
  title: string;
  updatedAt?: number;
  _creationTime: number;
}

export interface OverflowGroup {
  repo: RepoWithLogo;
  sessions: OverflowSession[];
}

interface SessionTabsOverflowMenuProps {
  groups: OverflowGroup[];
  /** All apps — so empty apps still get a New session entry. */
  allRepos: RepoWithLogo[];
  pathname: string;
}

/** Full active-session list (repo-grouped) + new-session links for every app. */
export function SessionTabsOverflowMenu({
  groups,
  allRepos,
  pathname,
}: SessionTabsOverflowMenuProps) {
  const navigate = useNavigate();
  const nonEmpty = groups.filter((g) => g.sessions.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="All sessions"
          aria-label="All sessions"
          className="flex h-full w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <IconChevronDown size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-72 overflow-y-auto"
      >
        {nonEmpty.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
            No active sessions
          </p>
        ) : (
          nonEmpty.map((group, index) => {
            const label = repoDisplayLabel(group.repo);
            const baseUrl = `${repoSessionBasePaths(group.repo)[0]}/sessions`;
            return (
              <div key={group.repo._id}>
                {index > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
                  {label}
                </DropdownMenuLabel>
                {group.sessions.map((session) => {
                  const pathSegment = entityPathSegment(session);
                  const href = pathSegment
                    ? `${baseUrl}/${pathSegment}`
                    : baseUrl;
                  const isSelected =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <DropdownMenuItem key={session._id} asChild>
                      <DynamicLink
                        to={href}
                        className={cn(
                          "cursor-pointer",
                          isSelected && "bg-accent",
                        )}
                      >
                        <span className="truncate">{session.title}</span>
                      </DynamicLink>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            );
          })
        )}
        {allRepos.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
              New session
            </DropdownMenuLabel>
            {allRepos.map((repo) => (
              <DropdownMenuItem
                key={`new-${repo._id}`}
                onSelect={() => {
                  navigate({ to: repoSessionsIndexPath(repo) });
                }}
              >
                <IconPlus size={14} />
                <span className="truncate">{repoDisplayLabel(repo)}</span>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
