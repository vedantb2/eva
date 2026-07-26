"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@eva/ui";
import {
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftCollapseFilled,
  IconPencil,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import {
  InboxIcon,
  SessionsIcon,
} from "@/lib/components/sidebar/icons/AnimatedNavIcons";
import { LogoMark } from "@/lib/components/LogoMark";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { RepoLabelDialog } from "@/lib/components/RepoLabelDialog";
import { RailAppHotkeys } from "@/lib/components/sidebar/RailAppHotkeys";
import { RailSettingsMenu } from "@/lib/components/sidebar/RailSettingsMenu";
import { SidebarUserMenu } from "@/lib/components/sidebar/SidebarUserMenu";
import { QueryErrorBoundary } from "@/lib/components/QueryErrorBoundary";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { useSearch } from "@/lib/contexts/SearchContext";
import { repoHref } from "@/lib/utils/repoUrl";
import {
  appLeafName,
  appMatchesLabel,
  repoDisplayLabel,
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
  onNavigate: () => void;
  userName: string;
  showSearch?: boolean;
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

function railTileActive(active: boolean): string {
  return active
    ? "border-primary/40 bg-primary/15 text-primary"
    : "border-transparent text-muted-foreground opacity-75 hover:bg-sidebar-accent/50 hover:opacity-100 hover:text-sidebar-foreground";
}

function formatCountLabel(count: number | undefined): string | null {
  if (count === undefined || count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}

function InboxUnreadBadge() {
  const unreadCount = useQuery(api.notifications.countUnread);
  const unreadLabel = formatCountLabel(unreadCount);
  if (!unreadLabel) return null;
  return (
    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
      {unreadLabel}
    </span>
  );
}

/**
 * Far-left icon rail: global destinations (Eva, Inbox, Teams, Artifacts,
 * Sessions), then repos, then collapse / search / account / settings at the
 * bottom. Testing (dev) lives in the settings dropdown.
 * App tiles are real Links (not buttons) so middle-click / cmd-click open a new tab.
 *
 * Session-count / sandbox-dot queries are deferred: calling undeployed Convex
 * functions throws through the router CatchBoundary and swaps the whole shell
 * (severe CLS). Re-enable via RepoRailLiveIndicators once cloud is synced.
 */
export function RepoRail(props: RepoRailProps) {
  return (
    <RepoRailView
      {...props}
      activeSessionCount={undefined}
      activeSandboxRepoIds={new Set()}
    />
  );
}

interface RepoRailViewProps extends RepoRailProps {
  activeSessionCount: number | undefined;
  activeSandboxRepoIds: ReadonlySet<Id<"githubRepos">>;
}

function RepoRailView({
  repos,
  currentOwner,
  currentName,
  currentAppName,
  pathname,
  onNavigate,
  userName,
  showSearch,
  activeSessionCount,
  activeSandboxRepoIds,
}: RepoRailViewProps) {
  const { collapsed, setCollapsed, setSessionsNavMode } = useSidebar();
  const { openSearch } = useSearch();
  const homeActive =
    pathname === "/home" || pathname === "/" || pathname.startsWith("/setup");
  const inboxActive = pathname === "/inbox" || pathname.startsWith("/inbox/");
  const teamsActive = pathname === "/teams" || pathname.startsWith("/teams/");
  const artifactsActive =
    pathname === "/artifacts" || pathname.startsWith("/artifacts/");
  const pathParts = pathname.split("/").filter(Boolean);
  const onRepoSessionsPath =
    pathParts.includes("sessions") && pathParts[0] !== "sessions";
  // Deep session links always belong to the root Sessions rail entry (no
  // per-app sessions sidebar), so highlight Sessions whenever the path is one.
  const sessionsActive =
    pathname === "/sessions" ||
    pathname.startsWith("/sessions/") ||
    onRepoSessionsPath;
  const sessionsLabel = formatCountLabel(activeSessionCount);
  const [renameRepo, setRenameRepo] = useState<RepoWithLogo | null>(null);

  return (
    <div className="flex h-full w-16 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar">
      <RailAppHotkeys repos={repos} onNavigate={onNavigate} />
      <div className="flex w-full flex-col items-center gap-1.5 px-0 pt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/home"
              onClick={onNavigate}
              aria-label="Eva home"
              className={cn(
                RAIL_TILE_CLASS,
                homeActive
                  ? "border-primary/40 bg-primary/15"
                  : "border-transparent opacity-75 hover:bg-sidebar-accent/50 hover:opacity-100",
              )}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-white shadow-sm">
                <LogoMark size={20} className="shrink-0" />
              </span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Eva</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/inbox"
              onClick={onNavigate}
              aria-label="Inbox"
              className={cn(RAIL_TILE_CLASS, railTileActive(inboxActive))}
            >
              <InboxIcon size={22} className="shrink-0" />
              <QueryErrorBoundary>
                <InboxUnreadBadge />
              </QueryErrorBoundary>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Inbox</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/teams"
              onClick={onNavigate}
              aria-label="Teams"
              className={cn(RAIL_TILE_CLASS, railTileActive(teamsActive))}
            >
              <IconUsers size={22} className="shrink-0" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Teams</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/artifacts"
              onClick={onNavigate}
              aria-label="Artifacts"
              className={cn(RAIL_TILE_CLASS, railTileActive(artifactsActive))}
            >
              <IconLayoutDashboard size={22} className="shrink-0" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Artifacts</TooltipContent>
        </Tooltip>
        <div className="h-px w-8 bg-sidebar-border" aria-hidden />
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/sessions"
              onClick={() => {
                setSessionsNavMode("global");
                onNavigate();
              }}
              aria-label={
                sessionsLabel ? `Sessions, ${sessionsLabel} active` : "Sessions"
              }
              className={cn(RAIL_TILE_CLASS, railTileActive(sessionsActive))}
            >
              <SessionsIcon size={22} className="shrink-0" />
              {sessionsLabel ? (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-success px-1 text-[10px] font-semibold leading-none text-white">
                  {sessionsLabel}
                </span>
              ) : null}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            {sessionsLabel ? `Sessions (${sessionsLabel})` : "Sessions"}
          </TooltipContent>
        </Tooltip>
        <div className="h-px w-8 bg-sidebar-border" aria-hidden />
      </div>
      <div className="scrollbar flex w-full flex-1 flex-col items-center gap-1.5 overflow-y-auto py-2">
        {repos.map((row, index) => {
          const displayName = repoDisplayLabel(row);
          // Mirrors RailAppHotkeys: only the first nine tiles get Mod+N.
          const hotkeyLabel = index < 9 ? `⌘${index + 1}` : null;
          // While the global Sessions destination is highlighted, don't also
          // light up a repo tile — the rail should show one active target.
          const active =
            !sessionsActive &&
            isRowActive(row, currentOwner, currentName, currentAppName);
          const tooltip = `${displayName} · ${row.owner}/${row.name}`;
          const hasActiveSandbox = activeSandboxRepoIds.has(row._id);

          return (
            <ContextMenu key={row._id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ContextMenuTrigger asChild>
                    <Link
                      to={repoHref(row.owner, row.name, row.rootDirectory)}
                      onClick={onNavigate}
                      aria-label={
                        hasActiveSandbox
                          ? `${tooltip}, sandbox active`
                          : tooltip
                      }
                      className={cn(
                        RAIL_TILE_CLASS,
                        active
                          ? "border-primary/40 bg-primary/15"
                          : "border-transparent opacity-50 hover:bg-sidebar-accent/50 hover:opacity-100",
                      )}
                    >
                      <RepoLogo
                        logoUrl={row.logoUrl}
                        size={30}
                        fallback={
                          <span
                            className={cn(
                              "flex size-[30px] items-center justify-center rounded-md text-sm font-semibold text-white",
                              tileColor(
                                `${row.owner}/${row.name}/${displayName}`,
                              ),
                            )}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        }
                      />
                      {hasActiveSandbox ? (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success"
                          aria-hidden
                        />
                      ) : null}
                    </Link>
                  </ContextMenuTrigger>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="flex items-center gap-2"
                >
                  {tooltip}
                  {hotkeyLabel ? (
                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {hotkeyLabel}
                    </kbd>
                  ) : null}
                </TooltipContent>
              </Tooltip>
              <ContextMenuContent onClick={(e) => e.stopPropagation()}>
                <ContextMenuItem onClick={() => setRenameRepo(row)}>
                  <IconPencil size={16} />
                  Rename
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>
      {renameRepo ? (
        <RepoLabelDialog
          open
          onOpenChange={(open) => {
            if (!open) setRenameRepo(null);
          }}
          repoId={renameRepo._id}
          label={renameRepo.label}
          fallbackName={appLeafName(renameRepo)}
        />
      ) : null}
      <div className="flex w-full flex-col items-center gap-1.5 border-t border-sidebar-border py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
              title={collapsed ? "Show sidebar" : "Hide sidebar"}
              className={cn(
                RAIL_TILE_CLASS,
                "border-transparent text-muted-foreground opacity-75 hover:bg-sidebar-accent/50 hover:opacity-100 hover:text-sidebar-foreground",
              )}
            >
              {collapsed ? (
                <IconLayoutSidebarLeftCollapseFilled
                  size={22}
                  className="shrink-0"
                />
              ) : (
                <IconLayoutSidebarLeftCollapse size={22} className="shrink-0" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Show sidebar" : "Hide sidebar"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => openSearch()}
              aria-label="Search"
              title="Search"
              className={cn(
                RAIL_TILE_CLASS,
                "border-transparent text-muted-foreground opacity-75 hover:bg-sidebar-accent/50 hover:opacity-100 hover:text-sidebar-foreground",
              )}
            >
              <IconSearch size={22} className="shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            Search
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </TooltipContent>
        </Tooltip>
        <SidebarUserMenu name={userName} showSearch={showSearch} />
        <RailSettingsMenu onNavigate={onNavigate} />
      </div>
    </div>
  );
}
