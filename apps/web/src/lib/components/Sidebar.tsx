"use client";

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { decodeRepoParam, repoHref as repoHrefUtil } from "@/lib/utils/repoUrl";
import { useUser } from "@clerk/clerk-react";
import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { AnimatePresence, motion } from "motion/react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconHammer,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftCollapseFilled,
  IconMenu2,
  IconMoon,
  IconSettings,
  IconSun,
  IconTestPipe,
  IconTool,
  IconX,
} from "@tabler/icons-react";
import {
  AutomationsIcon,
  DesignsIcon,
  DocumentsIcon,
  InboxIcon,
  ProjectsIcon,
  QuickTasksIcon,
  SessionsIcon,
  SettingsIcon,
  StatsIcon,
  TestingArenaIcon,
} from "@/lib/components/sidebar/icons/AnimatedNavIcons";
import { LogoMark } from "@/lib/components/LogoMark";
import { api } from "@conductor/backend";
import {
  Button,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@conductor/ui";
import { ActiveTasksBadge } from "@/lib/components/sidebar/ActiveTasksPopover";
import { BuildingProjectsBadge } from "@/lib/components/sidebar/BuildingProjectsBadge";
import { ActiveCountBadge } from "@/lib/components/sidebar/ActiveCountBadge";
import { UnreadInboxBadge } from "@/lib/components/sidebar/UnreadInboxBadge";
import { UnreadAutomationsBadge } from "@/lib/components/sidebar/UnreadAutomationsBadge";
import { SettingsSidebar } from "@/lib/components/sidebar/SettingsSidebar";
import { TeamMembers } from "@/lib/components/sidebar/TeamMembers";
import { SidebarUserMenu } from "@/lib/components/sidebar/SidebarUserMenu";
import { DesignSessionsSidebar } from "@/lib/components/sidebar/DesignSessionsSidebar";
import { DocsSidebar } from "@/lib/components/sidebar/DocsSidebar";
import { SessionsSidebar } from "@/lib/components/sidebar/SessionsSidebar";
import { TestingArenaSidebar } from "@/lib/components/sidebar/TestingArenaSidebar";
import { AutomationsSidebar } from "@/lib/components/sidebar/AutomationsSidebar";
import { RepoSwitcher } from "@/lib/components/RepoSwitcher";
import { RootSidebarContent } from "@/lib/components/sidebar/RootSidebarContent";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClass,
} from "@/lib/components/sidebar/SharedLayoutNav";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { usePageTitle } from "@/lib/contexts/PageTitleContext";
const KNOWN_SUB_PAGES = new Set([
  "projects",
  "designs",
  "docs",
  "sessions",
  "quick-tasks",
  "settings",
  "testing-arena",
  "stats",
  "automations",
  "inbox",
]);

const CONTEXT_SIDEBAR_BY_NAV_NAME = {
  Designs: "designs",
  Sessions: "sessions",
  Settings: "settings",
  Documents: "docs",
  "Testing Arena": "testing-arena",
  Automations: "automations",
} as const;

type ContextSidebarMode =
  | "main"
  | "designs"
  | "sessions"
  | "settings"
  | "docs"
  | "testing-arena"
  | "automations";

type RepoMainNavIcon = ComponentType<{
  size?: number;
  className?: string;
}>;

type RepoMainNavItem = {
  name: string;
  href: string;
  icon: RepoMainNavIcon;
  devOnly?: boolean;
};

type RepoMainNavGroup = {
  label: string;
  groupIcon: RepoMainNavIcon;
  items: RepoMainNavItem[];
  devOnly?: boolean;
};

function getInitialContextSidebarMode(pathname: string): ContextSidebarMode {
  const segments = pathname.split("/").filter(Boolean);
  for (let i = 2; i < segments.length; i++) {
    const s = segments[i];
    if (
      s === "designs" ||
      s === "sessions" ||
      s === "settings" ||
      s === "docs" ||
      s === "testing-arena" ||
      s === "automations"
    ) {
      return s;
    }
  }
  return "main";
}

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { collapsed, setCollapsed } = useSidebar();
  const { pageTitle } = usePageTitle();
  const [mobileOpen, setMobileOpen] = useState(false);

  useHotkey("Mod+I", (e) => {
    e.preventDefault();
    setCollapsed(!collapsed);
  });
  const [contextSidebarMode, setContextSidebarMode] =
    useState<ContextSidebarMode>(() => getInitialContextSidebarMode(pathname));

  const repos = useQuery(api.githubRepos.list, {});

  const { repoBasePath, owner, repoName, appName, isRepoRoute } = useMemo((): {
    repoBasePath: string | null;
    owner: string | null;
    repoName: string | null;
    appName: string | undefined;
    isRepoRoute: boolean;
  } => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return {
        repoBasePath: null,
        owner: null,
        repoName: null,
        appName: undefined,
        isRepoRoute: false,
      };
    }
    const o = segments[0];
    const n = segments[1];
    const nonRepoRoutes = new Set([
      "home",
      "sign-in",
      "sign-up",
      "setup",
      "teams",
      "inbox",
      "api",
      "settings",
      "testing",
    ]);
    // Guard non-repo routes before the repo-route heuristic below, otherwise
    // sub-paths like /teams/{id}/members are misread as /owner/repo/appName
    // (because "members" isn't a KNOWN_SUB_PAGE) and the repo nav renders.
    if (nonRepoRoutes.has(o)) {
      return {
        repoBasePath: null,
        owner: null,
        repoName: null,
        appName: undefined,
        isRepoRoute: false,
      };
    }
    if (segments.length >= 3 && !KNOWN_SUB_PAGES.has(segments[2])) {
      return {
        repoBasePath: `/${o}/${n}/${segments[2]}`,
        owner: o,
        repoName: n,
        appName: segments[2],
        isRepoRoute: true,
      };
    }
    const decoded = decodeRepoParam(n);
    return {
      repoBasePath: `/${o}/${n}`,
      owner: o,
      repoName: decoded.name,
      appName: decoded.appName,
      isRepoRoute: true,
    };
  }, [pathname]);

  const showContextSidebar = isRepoRoute && contextSidebarMode !== "main";

  const repo = useQuery(
    api.githubRepos.getByOwnerAndName,
    owner && repoName ? { owner, name: repoName, appName } : "skip",
  );

  const isDev = import.meta.env.DEV;

  const repoNavigation = useMemo(() => {
    if (!isRepoRoute || !repoBasePath) return [];
    const allGroups: RepoMainNavGroup[] = [
      {
        label: "BUILD",
        groupIcon: IconHammer,
        items: [
          {
            name: "Projects",
            href: `${repoBasePath}/projects`,
            icon: ProjectsIcon,
          },
          {
            name: "Designs",
            href: `${repoBasePath}/designs`,
            icon: DesignsIcon,
            devOnly: true,
          },
        ],
      },
      {
        label: "FIX",
        groupIcon: IconTool,
        items: [
          {
            name: "Quick Tasks",
            href: `${repoBasePath}/quick-tasks`,
            icon: QuickTasksIcon,
          },
          {
            name: "Sessions",
            href: `${repoBasePath}/sessions`,
            icon: SessionsIcon,
          },
        ],
      },
      {
        label: "TEST",
        groupIcon: IconTestPipe,
        // devOnly: true,
        items: [
          {
            name: "Documents",
            href: `${repoBasePath}/docs`,
            icon: DocumentsIcon,
            // devOnly: true,
          },
          {
            name: "Testing Arena",
            href: `${repoBasePath}/testing-arena`,
            icon: TestingArenaIcon,
            devOnly: true,
          },
        ],
      },
      {
        label: "SETTINGS",
        groupIcon: IconSettings,
        items: [
          {
            name: "Inbox",
            href: `${repoBasePath}/inbox`,
            icon: InboxIcon,
          },
          {
            name: "Automations",
            href: `${repoBasePath}/automations`,
            icon: AutomationsIcon,
          },
          {
            name: "Stats",
            href: `${repoBasePath}/stats`,
            icon: StatsIcon,
          },
          {
            name: "Settings",
            href: `${repoBasePath}/settings/config`,
            icon: SettingsIcon,
          },
        ],
      },
    ];
    if (isDev) return allGroups;
    return allGroups
      .filter((g) => !g.devOnly)
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => !i.devOnly),
      }))
      .filter((g) => g.items.length > 0);
  }, [repoBasePath, isRepoRoute, isDev]);

  const { theme, toggleTheme } = useThemeContext();

  const handleRepoSwitch = (
    selectedOwner: string,
    selectedName: string,
    rootDirectory?: string,
  ) => {
    const subPath = repoBasePath ? pathname.slice(repoBasePath.length) : "";
    const segments = subPath.split("/").filter(Boolean);
    const preservePath =
      segments.length > 0 && KNOWN_SUB_PAGES.has(segments[0]) ? subPath : "";
    const base = repoHrefUtil(selectedOwner, selectedName, rootDirectory);
    navigate({ to: `${base}${preservePath}` });
  };

  const navItemClass = (isActive: boolean) =>
    sidebarNavLinkClass(isActive, collapsed);

  const contextSidebarTitle =
    contextSidebarMode === "designs"
      ? "Designs"
      : contextSidebarMode === "sessions"
        ? "Sessions"
        : contextSidebarMode === "settings"
          ? "Settings"
          : contextSidebarMode === "docs"
            ? "Documents"
            : contextSidebarMode === "testing-arena"
              ? "Testing Arena"
              : contextSidebarMode === "automations"
                ? "Automations"
                : "";

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 bg-background/80 px-3 sm:px-4 lg:hidden">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMobileOpen(true)}
          className="-ml-1"
        >
          <IconMenu2 size={20} className="text-muted-foreground" />
        </Button>
        {pageTitle ? (
          <h1 className="mx-auto truncate text-base font-semibold tracking-[-0.02em] text-foreground text-balance">
            {pageTitle}
          </h1>
        ) : (
          <Link
            to="/home"
            className="mx-auto flex items-center gap-2 rounded-surface border border-border bg-muted/40 px-2.5 py-1.5"
          >
            <LogoMark size={26} />
            <span className="text-sm font-semibold tracking-[-0.02em] text-primary">
              Eva
            </span>
          </Link>
        )}
        <Button size="icon" variant="ghost" onClick={toggleTheme}>
          {theme === "dark" ? (
            <IconSun size={18} className="text-muted-foreground" />
          ) : (
            <IconMoon size={18} className="text-muted-foreground" />
          )}
        </Button>
      </header>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/62  lg:hidden"
            onClick={closeMobileSidebar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 motion-base transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed
            ? "w-[min(16rem,calc(100vw-3rem))] lg:w-20"
            : "w-[min(16rem,calc(100vw-3rem))]",
        )}
      >
        <div className="h-full">
          <div className="flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
            <div
              className={cn(
                "flex h-16 items-center",
                collapsed ? "px-2" : "px-3",
              )}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={
                    showContextSidebar
                      ? `${contextSidebarMode}-header`
                      : "main-header"
                  }
                  className={cn(
                    "relative flex w-full items-center",
                    collapsed ? "justify-center" : "justify-between",
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {showContextSidebar ? (
                    <>
                      {!collapsed && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setContextSidebarMode("main")}
                          className="motion-press h-8 w-8 shrink-0 hover:scale-[1.03] active:scale-[0.96]"
                          title="Back to main sidebar"
                        >
                          <IconChevronLeft size={16} />
                        </Button>
                      )}
                      {!collapsed && (
                        <span className="min-w-0 flex-1 truncate text-center text-sm font-medium text-sidebar-primary">
                          {contextSidebarTitle}
                        </span>
                      )}

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="motion-press lg:hidden hover:scale-[1.03] active:scale-[0.96]"
                          onClick={closeMobileSidebar}
                        >
                          <IconX size={18} className="text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="motion-press hidden h-8 w-8 lg:inline-flex hover:scale-[1.03] active:scale-[0.96]"
                          onClick={() => setCollapsed(!collapsed)}
                          title={
                            collapsed ? "Expand sidebar" : "Collapse sidebar"
                          }
                        >
                          {collapsed ? (
                            <IconLayoutSidebarLeftCollapseFilled
                              size={16}
                              className="text-sidebar-primary"
                            />
                          ) : (
                            <IconLayoutSidebarLeftCollapse
                              size={16}
                              className="text-sidebar-primary"
                            />
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {!collapsed && repoBasePath && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => navigate({ to: repoBasePath })}
                          className="motion-press h-8 w-8 shrink-0 hover:scale-[1.03] active:scale-[0.96]"
                          title="Repo home"
                        >
                          <IconHome size={16} />
                        </Button>
                      )}
                      {!collapsed && (
                        <Link
                          to="/home"
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sidebar-foreground"
                        >
                          <LogoMark size={24} className="shrink-0" />
                          <span className="text-sm font-semibold tracking-[-0.02em] text-sidebar-primary">
                            Eva
                          </span>
                        </Link>
                      )}

                      <div
                        className={cn(
                          "flex items-center gap-1",
                          collapsed ? "lg:mx-auto" : "ml-auto",
                        )}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="motion-press lg:hidden hover:scale-[1.03] active:scale-[0.96]"
                          onClick={closeMobileSidebar}
                        >
                          <IconX size={18} className="text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="motion-press hidden h-8 w-8 lg:inline-flex hover:scale-[1.03] active:scale-[0.96]"
                          onClick={() => setCollapsed(!collapsed)}
                          title={
                            collapsed ? "Expand sidebar" : "Collapse sidebar"
                          }
                        >
                          {collapsed ? (
                            <IconLayoutSidebarLeftCollapseFilled
                              size={16}
                              className="text-sidebar-primary"
                            />
                          ) : (
                            <IconLayoutSidebarLeftCollapse
                              size={16}
                              className="text-sidebar-primary"
                            />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <nav
              className={cn(
                "scrollbar flex min-h-0 flex-1 flex-col justify-between overflow-y-auto pb-4 pt-3",
                collapsed ? "lg:px-2 px-3" : "px-3",
              )}
            >
              <div className="space-y-4">
                {!isRepoRoute && (
                  <RootSidebarContent
                    collapsed={collapsed}
                    onNavigate={closeMobileSidebar}
                  />
                )}

                {isRepoRoute && repoBasePath && (
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={
                        showContextSidebar
                          ? `${contextSidebarMode}-nav`
                          : "main-nav"
                      }
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {showContextSidebar ? (
                        collapsed ? null : contextSidebarMode === "settings" ? (
                          <SettingsSidebar
                            basePath={repoBasePath}
                            pathname={pathname}
                            onNavigate={closeMobileSidebar}
                          />
                        ) : repo ? (
                          contextSidebarMode === "designs" ? (
                            <DesignSessionsSidebar
                              repoId={repo._id}
                              basePath={repoBasePath}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                            />
                          ) : contextSidebarMode === "sessions" ? (
                            <SessionsSidebar
                              repoId={repo._id}
                              basePath={repoBasePath}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                            />
                          ) : contextSidebarMode === "docs" ? (
                            <DocsSidebar
                              repoId={repo._id}
                              basePath={repoBasePath}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                            />
                          ) : contextSidebarMode === "testing-arena" ? (
                            <TestingArenaSidebar
                              repoId={repo._id}
                              basePath={repoBasePath}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                            />
                          ) : (
                            <AutomationsSidebar
                              repoId={repo._id}
                              basePath={repoBasePath}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                            />
                          )
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <Spinner size="sm" />
                          </div>
                        )
                      ) : (
                        <div className="space-y-4">
                          {!collapsed && (
                            <RepoSwitcher
                              repos={repos ?? []}
                              currentOwner={owner}
                              currentName={repoName}
                              currentAppName={appName}
                              onSelect={handleRepoSwitch}
                            />
                          )}

                          <SharedLayoutNav
                            layoutId="repo-main-nav"
                            className="space-y-4"
                          >
                            {repoNavigation.map((group) => (
                              <div key={group.label}>
                                {!collapsed && (
                                  <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                    <group.groupIcon size={12} />
                                    <span>{group.label}</span>
                                    <span
                                      aria-hidden
                                      className="ml-1 h-px flex-1 bg-sidebar-border/60"
                                    />
                                  </div>
                                )}
                                <div
                                  className={cn(
                                    "space-y-1",
                                    !collapsed && "pl-2",
                                  )}
                                >
                                  {group.items.map((item) => {
                                    const isActive = pathname.startsWith(
                                      item.href,
                                    );
                                    const contextMode =
                                      CONTEXT_SIDEBAR_BY_NAV_NAME[
                                        item.name as keyof typeof CONTEXT_SIDEBAR_BY_NAV_NAME
                                      ];

                                    if (contextMode && !collapsed) {
                                      const showActiveCount =
                                        (item.name === "Sessions" ||
                                          item.name === "Designs") &&
                                        repo;
                                      return (
                                        <SharedLayoutNavSurface
                                          key={item.name}
                                          itemId={item.name}
                                          isActive={isActive}
                                          className="group relative"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setContextSidebarMode(
                                                contextMode,
                                              );
                                            }}
                                            className={cn(
                                              navItemClass(isActive),
                                              "w-full pr-9",
                                            )}
                                          >
                                            <item.icon
                                              size={19}
                                              className={cn(
                                                "shrink-0",
                                                isActive
                                                  ? "text-sidebar-primary"
                                                  : "text-muted-foreground",
                                              )}
                                            />
                                            <span className="truncate">
                                              {item.name}
                                            </span>
                                            {showActiveCount && (
                                              <ActiveCountBadge
                                                repoId={repo._id}
                                                type={
                                                  item.name === "Sessions"
                                                    ? "sessions"
                                                    : "designs"
                                                }
                                              />
                                            )}
                                            {item.name === "Automations" &&
                                              repo && (
                                                <UnreadAutomationsBadge
                                                  repoId={repo._id}
                                                />
                                              )}
                                          </button>
                                          <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            className="absolute right-2 top-1/2 z-20 h-6 w-6 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-sidebar-foreground after:absolute after:inset-[-8px]"
                                            onClick={(event) => {
                                              event.preventDefault();
                                              event.stopPropagation();
                                              setContextSidebarMode(
                                                contextMode,
                                              );
                                            }}
                                            title={`Open ${item.name.toLowerCase()} sidebar`}
                                          >
                                            <IconChevronRight
                                              size={14}
                                              className="text-muted-foreground"
                                            />
                                          </Button>
                                        </SharedLayoutNavSurface>
                                      );
                                    }

                                    const linkElement = (
                                      <SharedLayoutNavSurface
                                        key={item.name}
                                        itemId={item.name}
                                        isActive={isActive}
                                      >
                                        <Link
                                          to={item.href}
                                          onClick={() => {
                                            if (contextMode) {
                                              setContextSidebarMode(
                                                contextMode,
                                              );
                                            }
                                            if (!contextMode) {
                                              closeMobileSidebar();
                                            }
                                          }}
                                          className={navItemClass(isActive)}
                                        >
                                          <item.icon
                                            size={19}
                                            className={cn(
                                              "shrink-0",
                                              isActive
                                                ? "text-sidebar-primary"
                                                : "text-muted-foreground",
                                            )}
                                          />
                                          {!collapsed && (
                                            <span className="truncate">
                                              {item.name}
                                            </span>
                                          )}
                                          {item.name === "Inbox" &&
                                            !collapsed && <UnreadInboxBadge />}
                                          {item.name === "Quick Tasks" &&
                                            !collapsed &&
                                            repo &&
                                            repoBasePath && (
                                              <ActiveTasksBadge
                                                repoId={repo._id}
                                                basePath={repoBasePath}
                                              />
                                            )}
                                          {item.name === "Projects" &&
                                            !collapsed &&
                                            repo &&
                                            repoBasePath && (
                                              <BuildingProjectsBadge
                                                repoId={repo._id}
                                                basePath={repoBasePath}
                                              />
                                            )}
                                        </Link>
                                      </SharedLayoutNavSurface>
                                    );

                                    if (collapsed) {
                                      return (
                                        <Tooltip key={item.name}>
                                          <TooltipTrigger asChild>
                                            {linkElement}
                                          </TooltipTrigger>
                                          <TooltipContent side="right">
                                            {item.name}
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    }

                                    return linkElement;
                                  })}
                                </div>
                              </div>
                            ))}
                          </SharedLayoutNav>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </nav>

            <div className={cn(collapsed ? "px-2 py-3" : "px-3 py-3")}>
              <TeamMembers collapsed={collapsed} />
              <SidebarUserMenu
                collapsed={collapsed}
                name={user?.fullName || user?.firstName || "User"}
                email={user?.primaryEmailAddress?.emailAddress}
                showSearch={isRepoRoute}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
