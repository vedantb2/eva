"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@conductor/ui";
import { InboxIcon } from "@/lib/components/sidebar/icons/AnimatedNavIcons";
import { RepoLogo } from "@/lib/components/RepoLogo";
import {
  appLeafName,
  appMatchesLabel,
  type RepoWithLogo,
} from "@/lib/utils/repoGrouping";

const TILE_PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-orange-500",
];

/** Deterministic tile colour so logo-less repos stay visually distinguishable. */
function tileColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % TILE_PALETTE.length;
  }
  return TILE_PALETTE[hash];
}

interface RepoRailProps {
  repos: RepoWithLogo[];
  currentOwner: string | null;
  currentName: string | null;
  currentAppName: string | undefined;
  pathname: string;
  onSelect: (owner: string, name: string, rootDirectory?: string) => void;
  onNavigate: () => void;
}

/** Whether a repo row (root repo or monorepo app) matches the active URL. */
function isRowActive(
  row: RepoWithLogo,
  owner: string | null,
  name: string | null,
  appName: string | undefined,
): boolean {
  if (row.owner !== owner || row.name !== name) return false;
  if (row.rootDirectory) {
    return appName !== undefined && appMatchesLabel(row, appName);
  }
  return appName === undefined;
}

const RAIL_TILE_CLASS =
  "relative flex size-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35";

/**
 * Far-left icon rail: Inbox at the top (global), then one icon per repo/app.
 * Clicking a repo switches the active app (preserving the current sub-page via
 * the parent's onSelect). Always visible; the active row is chipped.
 */
export function RepoRail({
  repos,
  currentOwner,
  currentName,
  currentAppName,
  pathname,
  onSelect,
  onNavigate,
}: RepoRailProps) {
  const unreadCount = useQuery(api.notifications.countUnread);
  const inboxActive = pathname === "/inbox" || pathname.startsWith("/inbox/");
  const unreadLabel =
    unreadCount && unreadCount > 0
      ? unreadCount > 99
        ? "99+"
        : String(unreadCount)
      : null;

  return (
    <div className="flex h-full w-16 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar">
      <div className="flex w-full flex-col items-center gap-1.5 px-0 pt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/inbox"
              onClick={onNavigate}
              aria-label={
                unreadLabel ? `Inbox, ${unreadLabel} unread` : "Inbox"
              }
              className={cn(
                RAIL_TILE_CLASS,
                inboxActive
                  ? "border-border bg-sidebar-accent text-sidebar-primary"
                  : "border-transparent text-muted-foreground opacity-75 hover:bg-sidebar-accent/50 hover:opacity-100 hover:text-sidebar-foreground",
              )}
            >
              <InboxIcon size={22} className="shrink-0" />
              {unreadLabel ? (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                  {unreadLabel}
                </span>
              ) : null}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            {unreadLabel ? `Inbox (${unreadLabel})` : "Inbox"}
          </TooltipContent>
        </Tooltip>
        <div className="h-px w-8 bg-sidebar-border" aria-hidden />
      </div>
      <div className="scrollbar flex w-full flex-1 flex-col items-center gap-1.5 overflow-y-auto py-2">
        {repos.map((row) => {
          const label = row.rootDirectory ? appLeafName(row) : row.name;
          const active = isRowActive(
            row,
            currentOwner,
            currentName,
            currentAppName,
          );
          const tooltip = row.rootDirectory
            ? `${row.owner}/${row.name} · ${label}`
            : `${row.owner}/${row.name}`;

          return (
            <Tooltip key={row._id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    onSelect(row.owner, row.name, row.rootDirectory)
                  }
                  aria-label={tooltip}
                  className={cn(
                    RAIL_TILE_CLASS,
                    active
                      ? "border-border bg-sidebar-accent"
                      : "border-transparent opacity-75 hover:bg-sidebar-accent/50 hover:opacity-100",
                  )}
                >
                  <RepoLogo
                    logoUrl={row.logoUrl}
                    size={30}
                    fallback={
                      <span
                        className={cn(
                          "flex size-[30px] items-center justify-center rounded-md text-sm font-semibold text-white",
                          tileColor(`${row.owner}/${row.name}/${label}`),
                        )}
                      >
                        {label.charAt(0).toUpperCase()}
                      </span>
                    }
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{tooltip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
