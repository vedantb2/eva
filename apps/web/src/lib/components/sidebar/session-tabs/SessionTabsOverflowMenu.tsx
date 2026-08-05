"use client";

import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  cn,
} from "@eva/ui";
import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { RepoLogo } from "@/lib/components/RepoLogo";
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

/** Full active-session list by app (Chrome-style overflow) + new-session links. */
export function SessionTabsOverflowMenu({
  groups,
  allRepos,
  pathname,
}: SessionTabsOverflowMenuProps) {
  const navigate = useNavigate();
  const sessionsByRepoId = new Map(
    groups.map((group) => [group.repo._id, group.sessions]),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="All sessions"
          aria-label="All sessions"
          className="flex h-full w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground"
        >
          <IconChevronDown size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-56 overflow-y-auto"
      >
        {allRepos.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
            No apps yet
          </p>
        ) : (
          allRepos.map((repo) => {
            const label = repoDisplayLabel(repo);
            const baseUrl = `${repoSessionBasePaths(repo)[0]}/sessions`;
            const sessions = sessionsByRepoId.get(repo._id) ?? [];
            return (
              <DropdownMenuSub key={repo._id}>
                <DropdownMenuSubTrigger>
                  <RepoLogo
                    logoUrl={repo.logoUrl}
                    size={16}
                    fallback={
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-muted text-[9px] font-semibold text-muted-foreground">
                        {label.charAt(0).toUpperCase()}
                      </span>
                    }
                  />
                  <span className="truncate">{label}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 w-64 overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-muted-foreground">
                      No active sessions
                    </p>
                  ) : (
                    sessions.map((session) => {
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
                    })
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      navigate({ to: repoSessionsIndexPath(repo) });
                    }}
                  >
                    <IconPlus size={14} />
                    New session
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
