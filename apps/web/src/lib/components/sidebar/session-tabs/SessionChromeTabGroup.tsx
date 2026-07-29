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
import { entityPathSegment } from "@/lib/numId";
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
 * Chrome tab group: tinted strip wrapping a group-name pill + that app's active
 * session tabs (and a per-group + for a new session). Selection is resolved here
 * rather than per tab so a tab knows whether its neighbour is selected — Chrome
 * drops the separator hairline next to the selected tab.
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
  const tabs = sortSessionsForSidebar(
    (sessions ?? []).filter(isSessionSidebarActive),
    "updated_at",
  ).map((session) => {
    const pathSegment = entityPathSegment(session);
    const href = pathSegment ? `${baseUrl}/${pathSegment}` : baseUrl;
    return {
      session,
      href,
      isSelected: pathname === href || pathname.startsWith(`${href}/`),
    };
  });

  if (hideWhenEmpty && !isLoading && tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-end gap-2 rounded-t-xl pt-2 pr-1.5 pb-0 pl-2",
        colors.strip,
      )}
    >
      {/* Group label pill — Chrome puts the name first, then its tabs. */}
      <div className="mb-1 flex shrink-0 items-center gap-1">
        <span
          className={cn(
            "max-w-[9rem] truncate rounded-full px-2.5 py-1 text-xs font-semibold",
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
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          onClick={() => {
            navigate({ to: repoSessionsIndexPath(repo) });
          }}
        >
          <IconPlus size={15} />
        </button>
      </div>
      {isLoading ? (
        <div className="flex h-9 items-center px-3">
          <Spinner size="sm" />
        </div>
      ) : (
        // Chrome tabs touch each other; separation comes from the hairline.
        <div className="flex items-end">
          {tabs.map(({ session, href, isSelected }, index) => (
            <SessionChromeTab
              key={session._id}
              session={session}
              href={href}
              isSelected={isSelected}
              showSeparator={
                index > 0 && !isSelected && !tabs[index - 1]?.isSelected
              }
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
          ))}
        </div>
      )}
    </div>
  );
}
