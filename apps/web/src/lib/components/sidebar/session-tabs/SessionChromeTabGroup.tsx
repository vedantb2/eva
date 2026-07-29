"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { Spinner, cn } from "@eva/ui";
import { IconPlus } from "@tabler/icons-react";
import { RepoLogo } from "@/lib/components/RepoLogo";
import {
  repoSessionBasePaths,
  repoSessionsIndexPath,
} from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { sortSessionsForSidebar } from "@/lib/components/sidebar/_utils/sessionsSidebarSettings";
import { SessionChromeTab } from "@/lib/components/sidebar/session-tabs/SessionChromeTab";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";
import { isSessionSidebarActive } from "@/routes/_repo/$owner/$repo/sessions/_utils/sessionReadOnly";

type SessionListItem = FunctionReturnType<typeof api.sessions.list>[number];

interface SessionChromeTabGroupProps {
  repo: RepoWithLogo;
  pathname: string;
  onRenameRequest: (session: SessionListItem, repo: RepoWithLogo) => void;
  onArchiveRequest: (session: SessionListItem, repo: RepoWithLogo) => void;
  /** When true, hide the group if it has no active tabs. */
  hideWhenEmpty?: boolean;
}

/**
 * One repo section in the Chrome tab strip: logo label, active tabs, `+` for
 * that app's composer. Archived / PR-terminal sessions are not shown here.
 */
export function SessionChromeTabGroup({
  repo,
  pathname,
  onRenameRequest,
  onArchiveRequest,
  hideWhenEmpty = true,
}: SessionChromeTabGroupProps) {
  const navigate = useNavigate();
  const sessions = useQuery(api.sessions.list, { repoId: repo._id });
  const createSession = useMutation(api.sessions.create);
  const label = repoDisplayLabel(repo);
  const baseUrl = `${repoSessionBasePaths(repo)[0]}/sessions`;
  const isLoading = sessions === undefined;
  const activeSorted = sortSessionsForSidebar(
    (sessions ?? []).filter(isSessionSidebarActive),
    "updated_at",
  );

  if (hideWhenEmpty && !isLoading && activeSorted.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-stretch border-r border-border",
        "last:border-r-0",
      )}
    >
      <div className="flex items-center gap-1.5 border-r border-border bg-muted/25 px-2">
        <RepoLogo
          logoUrl={repo.logoUrl}
          size={14}
          fallback={
            <span className="flex size-3.5 items-center justify-center rounded-sm bg-muted text-[9px] font-semibold text-muted-foreground">
              {label.charAt(0).toUpperCase()}
            </span>
          }
        />
        <span className="max-w-[6rem] truncate text-[11px] font-medium text-muted-foreground">
          {label}
        </span>
        <button
          type="button"
          aria-label={`New session in ${label}`}
          title={`New session in ${label}`}
          className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => {
            navigate({ to: repoSessionsIndexPath(repo) });
          }}
        >
          <IconPlus size={12} />
        </button>
      </div>
      {isLoading ? (
        <div className="flex h-8 items-center px-3">
          <Spinner size="sm" />
        </div>
      ) : (
        activeSorted.map((session) => (
          <SessionChromeTab
            key={session._id}
            session={session}
            baseUrl={baseUrl}
            pathname={pathname}
            onRenameRequest={() => onRenameRequest(session, repo)}
            onArchiveRequest={() => onArchiveRequest(session, repo)}
            onDuplicate={async () => {
              const { numId } = await createSession({
                repoId: repo._id,
                title: `${session.title} (copy)`,
              });
              return String(numId);
            }}
            onDuplicateNavigate={(segment) => {
              navigate({ to: `${baseUrl}/${segment}` });
            }}
          />
        ))
      )}
    </div>
  );
}
