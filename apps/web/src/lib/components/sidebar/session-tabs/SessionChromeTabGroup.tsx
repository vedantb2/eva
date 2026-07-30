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
import {
  SessionChromeTab,
  TAB_PREFERRED_WIDTH_REM,
} from "@/lib/components/sidebar/session-tabs/SessionChromeTab";
import { tabGroupColorForId } from "@/lib/components/sidebar/session-tabs/tabGroupColors";
import { entityPathSegment } from "@/lib/numId";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";
import { isSessionSidebarActive } from "@/routes/_repo/$owner/$repo/sessions/_utils/sessionReadOnly";

type SessionListItem = FunctionReturnType<typeof api.sessions.list>[number];

interface SessionChromeTabGroupProps {
  repo: RepoWithLogo;
  pathname: string;
  /** Collapsed groups show only the pill (plus the tab you are looking at). */
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRenameRequest: (session: SessionListItem, repo: RepoWithLogo) => void;
  onArchiveRequest: (session: SessionListItem, repo: RepoWithLogo) => void;
  /** When true, hide the group if it has no active tabs. */
  hideWhenEmpty?: boolean;
}

/**
 * Chrome tab group: a group-name pill, that app's active session tabs (and a
 * per-group + for a new session), and the coloured line Chrome draws underneath
 * to tie them together. Selection is resolved here
 * rather than per tab so a tab knows whether its neighbour is selected — Chrome
 * drops the separator hairline next to the selected tab.
 *
 * Clicking the pill collapses the group to a chip, as in Chrome. A collapsed
 * group still shows the selected tab: hiding the session you are reading would
 * leave the strip claiming you are nowhere.
 */
export function SessionChromeTabGroup({
  repo,
  pathname,
  isOpen,
  onOpenChange,
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

  const visibleTabs = isOpen ? tabs : tabs.filter((tab) => tab.isSelected);

  return (
    // Only open groups give up width — their tabs shrink first, so a collapsed
    // chip never loses characters to someone else's tabs. overflow-hidden cuts a
    // group at the strip edge, as Chrome does, rather than spilling over the next.
    <div
      className={cn(
        // px-2 leaves room for the selected tab's flared shoulders at either end
        // of the group; overflow-hidden is only a last-resort clip.
        "relative flex items-end gap-2 overflow-hidden px-2",
        isOpen ? "min-w-0" : "shrink-0",
      )}
    >
      {/* Chrome marks a group with a coloured line beneath it — no tinted fill
          behind the tabs. The selected tab's card covers the line it crosses. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-[3px] rounded-t-sm",
          colors.underline,
        )}
      />
      {/* Group label pill — Chrome puts the name first, then its tabs. The row
          is tab-height so a collapsed chip lines up with expanded groups. */}
      <div className="flex h-9 shrink-0 items-center gap-1">
        <button
          type="button"
          aria-expanded={isOpen}
          title={isOpen ? `Collapse ${label}` : `Expand ${label}`}
          className={cn(
            // Never shrinks: the app name is the group's identity, so width
            // pressure goes to the tabs instead.
            "flex max-w-[11rem] shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-85",
            colors.pill,
          )}
          onClick={() => {
            onOpenChange(!isOpen);
          }}
        >
          <span className="truncate">{label}</span>
        </button>
        {isOpen ? (
          <button
            type="button"
            aria-label={`New session in ${label}`}
            title={`New session in ${label}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            onClick={() => {
              navigate({ to: repoSessionsIndexPath(repo) });
            }}
          >
            <IconPlus size={15} />
          </button>
        ) : null}
      </div>
      {isLoading ? (
        <div className="flex h-9 items-center px-3">
          <Spinner size="sm" />
        </div>
      ) : (
        // Chrome tabs touch each other; separation comes from the hairline.
        // The row asks for one preferred tab width per tab and shrinks from
        // there, so tabs stay equal width whatever their titles say. The width
        // has to be stated rather than measured: a tab is a container query,
        // which means it cannot also be sized by its own contents.
        <div
          className="flex min-w-0 items-end"
          style={{
            width: `${visibleTabs.length * TAB_PREFERRED_WIDTH_REM}rem`,
          }}
        >
          {visibleTabs.map(({ session, href, isSelected }, index) => (
            <SessionChromeTab
              key={session._id}
              session={session}
              appLogoUrl={repo.logoUrl}
              appLabel={label}
              href={href}
              isSelected={isSelected}
              showSeparator={
                index > 0 && !isSelected && !visibleTabs[index - 1]?.isSelected
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
