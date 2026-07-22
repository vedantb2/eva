"use client";

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { decodeRepoParam, repoHref as repoHrefUtil } from "@/lib/utils/repoUrl";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { AnimatePresence, motion } from "motion/react";
import {
  IconChevronLeft,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftCollapseFilled,
  IconMenu2,
  IconMoon,
  IconSun,
  IconX,
} from "@tabler/icons-react";
import { LogoMark } from "@/lib/components/LogoMark";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { CrossfadeIcon } from "@/lib/components/ui/CrossfadeIcon";
import { api } from "@conductor/backend";
import { Button, Spinner, cn } from "@conductor/ui";
import { SettingsSidebar } from "@/lib/components/sidebar/SettingsSidebar";
import { DesignSessionsSidebar } from "@/lib/components/sidebar/DesignSessionsSidebar";
import { DocsSidebar } from "@/lib/components/sidebar/DocsSidebar";
import { ReviewsSidebar } from "@/lib/components/sidebar/ReviewsSidebar";
import { SessionsSidebar } from "@/lib/components/sidebar/SessionsSidebar";
import { TestingArenaSidebar } from "@/lib/components/sidebar/TestingArenaSidebar";
import { AutomationsSidebar } from "@/lib/components/sidebar/AutomationsSidebar";
import { RepoRail } from "@/lib/components/sidebar/RepoRail";
import { RepoNavSections } from "@/lib/components/sidebar/RepoNavSections";
import { RepoTopNav } from "@/lib/components/sidebar/RepoTopNav";
import { RepoStatsSummary } from "@/lib/components/sidebar/RepoStatsSummary";
import { type ContextSidebarMode } from "@/lib/components/sidebar/contextSidebarModes";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { usePageTitle } from "@/lib/contexts/PageTitleContext";
import { usePersistedScrollParent } from "@/lib/hooks/usePersistedScrollParent";
import { repoDisplayLabel } from "@/lib/utils/repoGrouping";
const KNOWN_SUB_PAGES = new Set([
  "projects",
  "designs",
  "docs",
  "reviews",
  "sessions",
  "quick-tasks",
  "settings",
  "testing-arena",
  "stats",
  "automations",
  "inbox",
  "drafts",
]);

function getInitialContextSidebarMode(pathname: string): ContextSidebarMode {
  const segments = pathname.split("/").filter(Boolean);
  for (let i = 2; i < segments.length; i++) {
    const s = segments[i];
    if (
      s === "designs" ||
      s === "sessions" ||
      s === "settings" ||
      s === "docs" ||
      s === "reviews" ||
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

  const { repoBasePath, owner, repoName, appName, isRepoRoute } = ((): {
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
      "artifacts",
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
  })();

  const showContextSidebar = isRepoRoute && contextSidebarMode !== "main";

  const repo = useQuery(
    api.githubRepos.getByOwnerAndName,
    owner && repoName ? { owner, name: repoName, appName } : "skip",
  );
  const repoLogoUrl = useQuery(
    api.githubRepos.getLogoUrl,
    repo?._id ? { repoId: repo._id } : "skip",
  );
  const team = useQuery(
    api.teams.get,
    repo?.teamId ? { id: repo.teamId } : "skip",
  );
  const teamBackgroundUrl = team?.backgroundUrl ?? null;

  const sidebarScrollKey =
    owner && repoName
      ? `${owner}/${repoName}${appName ? `/${appName}` : ""}/sidebar/${contextSidebarMode}`
      : `sidebar/${contextSidebarMode}`;
  const { scrollRef: sidebarScrollRef } =
    usePersistedScrollParent(sidebarScrollKey);

  const { theme, toggleTheme } = useThemeContext();

  const closeMobileSidebar = () => setMobileOpen(false);

  const handleRepoSwitch = (
    selectedOwner: string,
    selectedName: string,
    rootDirectory?: string,
  ) => {
    // Clicking an app in the rail always routes to the repo root, not the
    // current sub-page.
    const base = repoHrefUtil(selectedOwner, selectedName, rootDirectory);
    navigate({ to: base });
    closeMobileSidebar();
  };

  const contextSidebarTitle =
    contextSidebarMode === "designs"
      ? "Designs"
      : contextSidebarMode === "sessions"
        ? "Sessions"
        : contextSidebarMode === "settings"
          ? "Settings"
          : contextSidebarMode === "docs"
            ? "Documents"
            : contextSidebarMode === "reviews"
              ? "Reviews"
              : contextSidebarMode === "testing-arena"
                ? "Testing Arena"
                : contextSidebarMode === "automations"
                  ? "Automations"
                  : "";

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
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <CrossfadeIcon
            show={theme === "dark"}
            trueKey="sun"
            falseKey="moon"
            className="relative flex size-[18px] items-center justify-center"
            whenTrue={<IconSun size={18} className="text-muted-foreground" />}
            whenFalse={<IconMoon size={18} className="text-muted-foreground" />}
          />
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
          "fixed inset-y-0 left-0 z-50 flex motion-base transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Global pages are rail-only; repo pages keep the wider nav panel.
          isRepoRoute
            ? cn(
                "w-[min(20rem,calc(100vw-1.5rem))]",
                collapsed ? "lg:w-36" : "lg:w-80",
              )
            : "w-16",
        )}
      >
        <RepoRail
          repos={repos ?? []}
          currentOwner={owner}
          currentName={repoName}
          currentAppName={appName}
          pathname={pathname}
          onSelect={handleRepoSwitch}
          onNavigate={closeMobileSidebar}
          userName={user?.fullName || user?.firstName || "User"}
          userEmail={user?.primaryEmailAddress?.emailAddress}
          showSearch={isRepoRoute}
        />
        {isRepoRoute && repoBasePath ? (
          <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
            <div
              className={cn(
                "relative flex items-center overflow-hidden",
                teamBackgroundUrl && !showContextSidebar ? "h-24" : "h-16",
                collapsed ? "px-2" : "px-3",
              )}
            >
              {teamBackgroundUrl && !showContextSidebar ? (
                <>
                  <img
                    src={teamBackgroundUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-sidebar/40 via-sidebar/55 to-sidebar/90" />
                </>
              ) : null}
              <motion.div
                key={
                  showContextSidebar
                    ? `${contextSidebarMode}-header`
                    : "main-header"
                }
                className={cn(
                  "relative z-10 flex w-full items-center",
                  collapsed ? "justify-center" : "justify-between",
                  teamBackgroundUrl &&
                    !showContextSidebar &&
                    "[&_span]:text-sidebar-primary [&_button]:bg-sidebar/50 [&_button]:backdrop-blur-sm",
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
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
                    {!collapsed && repoName ? (
                      <div
                        className="flex min-w-0 flex-1 items-center justify-center gap-1.5"
                        title={
                          repo
                            ? `${repoDisplayLabel(repo)} (${repo.owner}/${repo.name})`
                            : appName
                              ? `${repoName} / ${appName}`
                              : repoName
                        }
                      >
                        {repoLogoUrl ? (
                          <RepoLogo
                            logoUrl={repoLogoUrl}
                            size={18}
                            fallback={null}
                          />
                        ) : null}
                        <span className="min-w-0 truncate text-sm font-medium text-sidebar-primary">
                          {repo
                            ? repoDisplayLabel(repo)
                            : appName
                              ? `${repoName} / ${appName}`
                              : repoName}
                        </span>
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "flex items-center gap-1",
                        collapsed ? "lg:mx-auto" : "shrink-0",
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
            </div>

            <nav
              ref={sidebarScrollRef}
              className="scrollbar flex min-h-0 flex-1 flex-col justify-between overflow-y-auto py-3 px-2"
            >
              <div className="space-y-4">
                <motion.div
                  key={
                    showContextSidebar
                      ? `${contextSidebarMode}-nav`
                      : "main-nav"
                  }
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
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
                      ) : contextSidebarMode === "reviews" ? (
                        <ReviewsSidebar
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
                      <RepoTopNav
                        repoBasePath={repoBasePath}
                        pathname={pathname}
                        collapsed={collapsed}
                        repo={repo}
                        onNavigate={closeMobileSidebar}
                      />
                      <RepoNavSections
                        repoBasePath={repoBasePath}
                        pathname={pathname}
                        collapsed={collapsed}
                        repo={repo}
                        onOpenContextSidebar={setContextSidebarMode}
                        onNavigate={closeMobileSidebar}
                      />
                    </div>
                  )}
                </motion.div>
              </div>
            </nav>

            <div className={cn(collapsed ? "px-2 py-3" : "px-3 py-3")}>
              <RepoStatsSummary
                repo={repo}
                repoBasePath={repoBasePath}
                collapsed={collapsed}
              />
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
