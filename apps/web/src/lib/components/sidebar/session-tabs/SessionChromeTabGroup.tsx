"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { Spinner, cn } from "@eva/ui";
import { IconPlus } from "@tabler/icons-react";
import {
  repoSessionBasePaths,
  repoSessionsIndexPath,
} from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { sortSessionsForSidebar } from "@/lib/components/sidebar/_utils/sessionsSidebarSettings";
import { SessionChromeTab } from "@/lib/components/sidebar/session-tabs/SessionChromeTab";
import { tabGroupColorForId } from "@/lib/components/sidebar/session-tabs/tabGroupColors";
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
 * Chrome tab group: colored strip wrapping a group-name pill + that app's
 * active session tabs (and a per-group + for new session).
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
  const colors = tabGroupColorForId(repo._id);
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
        "mr-2 flex shrink-0 items-end gap-1 rounded-t-xl px-1.5 pt-1.5 pb-0",
        colors.strip,
      )}
    >
      {/* Group label pill — Chrome puts the name first, then its tabs. */}
      <div className="mb-1.5 flex shrink-0 items-center gap-0.5 pl-0.5">
        <span
          className={cn(
            "max-w-[8rem] truncate rounded-full px-2.5 py-0.5 text-xs font-semibold",
            colors.pill,
          )}
          title={label}
        >
          {label}
        </span>
        <button
          type="button"
          aria-label={`New session in ${label}`}
          title={`New session in ${label}`}
          className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground"
          onClick={() => {
            navigate({ to: repoSessionsIndexPath(repo) });
          }}
        >
          <IconPlus size={14} />
        </button>
      </div>
      {isLoading ? (
        <div className="flex h-9 items-center px-3">
          <Spinner size="sm" />
        </div>
      ) : (
        activeSorted.map((session) => (
          <SessionChromeTab
            key={session._id}
            session={session}
            baseUrl={baseUrl}
            pathname={pathname}
            accentBorderClass={colors.accent}
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
