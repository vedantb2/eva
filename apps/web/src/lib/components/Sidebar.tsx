"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { decodeRepoParam } from "@/lib/utils/repoUrl";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { m, AnimatePresence } from "motion/react";
import {
  IconChevronLeft,
  IconMenu2,
  IconMoon,
  IconSun,
  IconCircleHalf,
  IconX,
} from "@tabler/icons-react";
import { LogoMark } from "@/lib/components/LogoMark";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { api } from "@eva/backend";
import { Button, Spinner, cn } from "@eva/ui";
import { SettingsSidebar } from "@/lib/components/sidebar/SettingsSidebar";
import { DocsSidebar } from "@/lib/components/sidebar/DocsSidebar";
import { ReviewsSidebar } from "@/lib/components/sidebar/ReviewsSidebar";
import { GlobalSessionsSidebar } from "@/lib/components/sidebar/GlobalSessionsSidebar";
import { HomeSidebar } from "@/lib/components/sidebar/HomeSidebar";
import { TestingArenaSidebar } from "@/lib/components/sidebar/TestingArenaSidebar";
import { AutomationsSidebar } from "@/lib/components/sidebar/AutomationsSidebar";
import { RepoRail } from "@/lib/components/sidebar/RepoRail";
import { RepoNavSections } from "@/lib/components/sidebar/RepoNavSections";
import { RepoTopNav } from "@/lib/components/sidebar/RepoTopNav";
import { RepoStatsSummary } from "@/lib/components/sidebar/RepoStatsSummary";
import { SidebarResizeHandle } from "@/lib/components/sidebar/SidebarResizeHandle";
import { ContextSidebarHeaderActionProvider } from "@/lib/components/sidebar/ContextSidebarHeaderAction";
import { SessionsSidebarOptionsMenu } from "@/lib/components/sidebar/_components/SessionsSidebarOptionsMenu";
import { type ContextSidebarMode } from "@/lib/components/sidebar/contextSidebarModes";
import {
  isGlobalSettingsPath,
  isHomePath,
} from "@/lib/components/sidebar/homePaths";
import { GlobalSettingsSidebar } from "@/lib/components/sidebar/GlobalSettingsSidebar";
import { useChromeSessionTabsActive } from "@/lib/components/sidebar/session-tabs/useChromeSessionTabs";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { usePageTitle } from "@/lib/contexts/PageTitleContext";
import { usePersistedScrollParent } from "@/lib/hooks/usePersistedScrollParent";
import { repoDisplayLabel } from "@/lib/utils/repoGrouping";
const KNOWN_SUB_PAGES = new Set([
  "projects",
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
  const { user } = useUser();
  const {
    collapsed,
    setCollapsed,
    setSessionsNavMode,
    sidebarWidth,
    setSidebarWidth,
  } = useSidebar();
  const { pageTitle } = usePageTitle();
  const [mobileOpen, setMobileOpen] = useState(false);

  useHotkey("Mod+I", (e) => {
    e.preventDefault();
    setCollapsed(!collapsed);
  });
  const [contextSidebarMode, setContextSidebarMode] =
    useState<ContextSidebarMode>(() => getInitialContextSidebarMode(pathname));

  // Sidebar now persists across sections, so re-derive the context sidebar mode on navigation.
  useEffect(() => {
    setContextSidebarMode(getInitialContextSidebarMode(pathname));
  }, [pathname]);

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
      "sessions",
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

  const pathParts = pathname.split("/").filter(Boolean);
  const isGlobalSessionsLanding =
    pathname === "/sessions" || pathname === "/sessions/";
  // Per-app Sessions sidebar was removed; any sessions URL (landing or deep
  // link like /$owner/$repo/.../sessions/$numId/preview) uses the root list.
  const isRepoSessionsPath = isRepoRoute && pathParts.includes("sessions");
  const isSessionsPath = isGlobalSessionsLanding || isRepoSessionsPath;
  // Experimental Chrome tabs replace the sessions second column (rail only).
  const useChromeSessionTabs = useChromeSessionTabsActive(pathname);
  const showGlobalSessionsPanel = isSessionsPath && !useChromeSessionTabs;
  const showHomePanel = isHomePath(pathname);
  const showGlobalSettingsPanel =
    isGlobalSettingsPath(pathname) ||
    (import.meta.env.DEV &&
      (pathname === "/testing" || pathname.startsWith("/testing/")));
  const showSidePanel =
    (isRepoRoute && !useChromeSessionTabs) ||
    (isGlobalSessionsLanding && !useChromeSessionTabs) ||
    showHomePanel ||
    showGlobalSettingsPanel;

  useEffect(() => {
    if (isGlobalSessionsLanding || isRepoSessionsPath) {
      setSessionsNavMode("global");
    }
  }, [isGlobalSessionsLanding, isRepoSessionsPath, setSessionsNavMode]);

  const showContextSidebar =
    isRepoRoute && !showGlobalSessionsPanel && contextSidebarMode !== "main";

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

  // Global panels (Sessions, Home, Settings) are a plain title + list: no repo
  // header, no team background, no back button.
  const isFlatPanel =
    showGlobalSessionsPanel || showHomePanel || showGlobalSettingsPanel;
  const flatPanelTitle = showGlobalSessionsPanel
    ? "Sessions"
    : showGlobalSettingsPanel
      ? "Settings"
      : "Home";
  // One key drives the header/nav enter animations and the header-action scope.
  const panelKey = showGlobalSessionsPanel
    ? "global-sessions"
    : showGlobalSettingsPanel
      ? "global-settings"
      : showHomePanel
        ? "home"
        : showContextSidebar
          ? contextSidebarMode
          : "main";

  const contextSidebarTitle =
    contextSidebarMode === "settings"
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
          {theme === "dark" ? (
            <IconSun size={18} className="text-muted-foreground" />
          ) : theme === "neutral" ? (
            <IconMoon size={18} className="text-muted-foreground" />
          ) : (
            <IconCircleHalf size={18} className="text-muted-foreground" />
          )}
        </Button>
      </header>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <m.div
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
          // Global pages are rail-only except Sessions (grouped cross-repo list).
          // Collapsed = hide the secondary panel entirely (rail only on lg+).
          showSidePanel
            ? cn(
                "w-[min(20rem,calc(100vw-1.5rem))]",
                collapsed ? "lg:w-16" : "lg:w-[var(--eva-sidebar-width,20rem)]",
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
          onNavigate={closeMobileSidebar}
          userName={user?.fullName || user?.firstName || "User"}
          showSearch={isRepoRoute}
        />
        {showSidePanel ? (
          <div
            className={cn(
              "relative flex h-full min-w-0 flex-1 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar",
              // Keep the drawer content on mobile even when the desktop panel is hidden.
              collapsed && "lg:hidden",
            )}
          >
            <ContextSidebarHeaderActionProvider key={panelKey}>
              {(headerAction) => (
                <>
                  <div
                    className={cn(
                      // Always reserve tall header on main repo panel so team
                      // background resolving later does not shift the nav list (CLS).
                      "relative flex items-center overflow-hidden px-3",
                      !showContextSidebar && !isFlatPanel ? "h-24" : "h-16",
                    )}
                  >
                    {teamBackgroundUrl &&
                    !showContextSidebar &&
                    !isFlatPanel ? (
                      <>
                        <img
                          src={teamBackgroundUrl}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-sidebar/40 via-sidebar/55 to-sidebar/90" />
                      </>
                    ) : null}
                    <m.div
                      key={`${panelKey}-header`}
                      className={cn(
                        "relative z-10 flex w-full items-center justify-between",
                        teamBackgroundUrl &&
                          !showContextSidebar &&
                          !isFlatPanel &&
                          "[&_span]:text-sidebar-primary [&_button]:bg-sidebar/50 [&_button]:backdrop-blur-sm",
                      )}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isFlatPanel ? (
                        <>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-[-0.02em] text-sidebar-primary">
                            {flatPanelTitle}
                          </span>
                          <div className="flex shrink-0 items-center gap-0.5">
                            {showGlobalSessionsPanel ? (
                              <SessionsSidebarOptionsMenu />
                            ) : null}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="motion-press shrink-0 lg:hidden hover:scale-[1.03] active:scale-[0.96]"
                              onClick={closeMobileSidebar}
                            >
                              <IconX
                                size={18}
                                className="text-muted-foreground"
                              />
                            </Button>
                          </div>
                        </>
                      ) : showContextSidebar ? (
                        <>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setContextSidebarMode("main")}
                            className="motion-press h-8 w-8 shrink-0 hover:scale-[1.03] active:scale-[0.96]"
                            title="Back to main sidebar"
                          >
                            <IconChevronLeft size={16} />
                          </Button>
                          <span className="min-w-0 flex-1 truncate text-center text-sm font-medium text-sidebar-primary">
                            {contextSidebarTitle}
                          </span>
                          <div className="flex shrink-0 items-center">
                            {headerAction}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="motion-press shrink-0 lg:hidden hover:scale-[1.03] active:scale-[0.96]"
                              onClick={closeMobileSidebar}
                            >
                              <IconX
                                size={18}
                                className="text-muted-foreground"
                              />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          {repoName ? (
                            <div
                              className="flex min-w-0 flex-1 items-center justify-center gap-2"
                              title={
                                repo
                                  ? `${repoDisplayLabel(repo)} (${repo.owner}/${repo.name})`
                                  : appName
                                    ? `${repoName} / ${appName}`
                                    : repoName
                              }
                            >
                              {/* Always reserve the logo slot so late logoUrl does not reflow the title. */}
                              <RepoLogo
                                logoUrl={repoLogoUrl}
                                size={28}
                                fallback={
                                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                                    {(repo
                                      ? repoDisplayLabel(repo)
                                      : (repoName ?? "?")
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                }
                              />
                              <span className="min-w-0 truncate text-lg font-medium text-sidebar-primary">
                                {repo
                                  ? repoDisplayLabel(repo)
                                  : appName
                                    ? `${repoName} / ${appName}`
                                    : repoName}
                              </span>
                            </div>
                          ) : null}

                          <Button
                            size="icon"
                            variant="ghost"
                            className="motion-press shrink-0 lg:hidden hover:scale-[1.03] active:scale-[0.96]"
                            onClick={closeMobileSidebar}
                          >
                            <IconX
                              size={18}
                              className="text-muted-foreground"
                            />
                          </Button>
                        </>
                      )}
                    </m.div>
                  </div>

                  <nav
                    ref={sidebarScrollRef}
                    className={cn(
                      "scrollbar flex min-h-0 flex-1 flex-col justify-between overflow-y-auto",
                      showGlobalSessionsPanel ? "px-1 py-1" : "px-2 py-3",
                    )}
                  >
                    <div
                      className={
                        showGlobalSessionsPanel ? "space-y-0" : "space-y-4"
                      }
                    >
                      <m.div
                        key={`${panelKey}-nav`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showGlobalSessionsPanel ? (
                          <GlobalSessionsSidebar
                            pathname={pathname}
                            onNavigate={closeMobileSidebar}
                          />
                        ) : showHomePanel ? (
                          <HomeSidebar
                            pathname={pathname}
                            onNavigate={closeMobileSidebar}
                          />
                        ) : showGlobalSettingsPanel ? (
                          <GlobalSettingsSidebar
                            pathname={pathname}
                            onNavigate={closeMobileSidebar}
                          />
                        ) : showContextSidebar ? (
                          contextSidebarMode === "settings" ? (
                            <SettingsSidebar
                              basePath={repoBasePath ?? ""}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                            />
                          ) : repo && repoBasePath ? (
                            contextSidebarMode === "docs" ? (
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
                        ) : repoBasePath ? (
                          <div className="space-y-4">
                            <RepoTopNav
                              repoBasePath={repoBasePath}
                              pathname={pathname}
                              collapsed={false}
                              repo={repo}
                              onNavigate={closeMobileSidebar}
                            />
                            <RepoNavSections
                              repoBasePath={repoBasePath}
                              pathname={pathname}
                              collapsed={false}
                              repo={repo}
                              onOpenContextSidebar={(mode) => {
                                setContextSidebarMode(mode);
                              }}
                              onNavigate={closeMobileSidebar}
                            />
                          </div>
                        ) : null}
                      </m.div>
                    </div>
                  </nav>

                  {isRepoRoute && repoBasePath && !showGlobalSessionsPanel ? (
                    <div className="px-3 py-3">
                      <RepoStatsSummary
                        repo={repo}
                        repoBasePath={repoBasePath}
                        collapsed={false}
                      />
                    </div>
                  ) : null}
                  {!collapsed ? (
                    <SidebarResizeHandle
                      width={sidebarWidth}
                      onWidthChange={setSidebarWidth}
                    />
                  ) : null}
                </>
              )}
            </ContextSidebarHeaderActionProvider>
          </div>
        ) : null}
      </aside>
    </>
  );
}
