"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import {
  IconBrain,
  IconBrandGithub,
  IconChartBar,
  IconChecklist,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconFlask,
  IconHammer,
  IconLayoutKanban,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftCollapseFilled,
  IconMenu2,
  IconMoon,
  IconPalette,
  IconPlus,
  IconSelector,
  IconShield,
  IconSun,
  IconTerminal2,
  IconTestPipe,
  IconTool,
  IconX,
} from "@tabler/icons-react";
import { api } from "@conductor/backend";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Spinner,
  cn,
} from "@conductor/ui";
import { ActiveTasksAccordion } from "@/lib/components/sidebar/ActiveTasksAccordion";
import { AdminSidebar } from "@/lib/components/sidebar/AdminSidebar";
import { AnalyseSidebar } from "@/lib/components/sidebar/AnalyseSidebar";
import { DesignSessionsSidebar } from "@/lib/components/sidebar/DesignSessionsSidebar";
import { DocsSidebar } from "@/lib/components/sidebar/DocsSidebar";
import { SessionsSidebar } from "@/lib/components/sidebar/SessionsSidebar";
import { TestingArenaSidebar } from "@/lib/components/sidebar/TestingArenaSidebar";
import { NotificationsPopoverClient } from "@/lib/components/NotificationsPopoverClient";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { decodeRepoSlug, encodeRepoSlug } from "@/lib/utils/repoUrl";

const CONTEXT_SIDEBAR_BY_NAV_NAME = {
  Design: "design",
  Sessions: "sessions",
  Analyse: "analyse",
  Admin: "admin",
  Documents: "docs",
  "Testing Arena": "testing-arena",
} as const;

type ContextSidebarMode =
  | "main"
  | "design"
  | "sessions"
  | "analyse"
  | "admin"
  | "docs"
  | "testing-arena";

function getInitialContextSidebarMode(pathname: string): ContextSidebarMode {
  const segment = pathname.split("/")[2];
  if (
    segment === "design" ||
    segment === "sessions" ||
    segment === "analyse" ||
    segment === "admin" ||
    segment === "docs" ||
    segment === "testing-arena"
  ) {
    return segment;
  }
  return "main";
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contextSidebarMode, setContextSidebarMode] =
    useState<ContextSidebarMode>(() => getInitialContextSidebarMode(pathname));
  const [designCreateRequestId, setDesignCreateRequestId] = useState(0);
  const [sessionsCreateRequestId, setSessionsCreateRequestId] = useState(0);
  const [analyseCreateRequestId, setAnalyseCreateRequestId] = useState(0);
  const [docsCreateRequestId, setDocsCreateRequestId] = useState(0);
  const [testingArenaCreateRequestId, setTestingArenaCreateRequestId] =
    useState(0);

  const repos = useQuery(api.githubRepos.list);

  const repoSlug = useMemo(() => {
    const match = pathname.match(/^\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const repoFullName = repoSlug ? decodeRepoSlug(repoSlug) : null;
  const isRepoRoute = Boolean(repoSlug && repoFullName?.includes("/"));
  const showContextSidebar = isRepoRoute && contextSidebarMode !== "main";
  const [owner, name] = repoFullName ? repoFullName.split("/") : [null, null];

  const repo = useQuery(
    api.githubRepos.getByOwnerAndName,
    owner && name ? { owner, name } : "skip",
  );

  const repoNavigation = useMemo(
    () =>
      isRepoRoute && repoSlug
        ? [
            {
              label: "BUILD",
              groupIcon: IconHammer,
              items: [
                {
                  name: "Projects",
                  href: `/${repoSlug}/projects`,
                  icon: IconLayoutKanban,
                },
                {
                  name: "Design",
                  href: `/${repoSlug}/design`,
                  icon: IconPalette,
                },
              ],
            },
            {
              label: "FIX",
              groupIcon: IconTool,
              items: [
                {
                  name: "Quick Tasks",
                  href: `/${repoSlug}/quick-tasks`,
                  icon: IconChecklist,
                },
                {
                  name: "Sessions",
                  href: `/${repoSlug}/sessions`,
                  icon: IconTerminal2,
                },
              ],
            },
            {
              label: "TEST",
              groupIcon: IconTestPipe,
              items: [
                {
                  name: "Documents",
                  href: `/${repoSlug}/docs`,
                  icon: IconFileText,
                },
                {
                  name: "Testing Arena",
                  href: `/${repoSlug}/testing-arena`,
                  icon: IconFlask,
                },
              ],
            },
            {
              label: "DATA",
              groupIcon: IconChartBar,
              items: [
                {
                  name: "Analyse",
                  href: `/${repoSlug}/analyse`,
                  icon: IconBrain,
                },
              ],
            },
            {
              label: "ADMIN",
              groupIcon: IconShield,
              items: [
                {
                  name: "Admin",
                  href: `/${repoSlug}/admin`,
                  icon: IconShield,
                },
              ],
            },
          ]
        : [],
    [repoSlug, isRepoRoute],
  );

  const { theme, toggleTheme } = useThemeContext();

  const handleRepoSelect = (selectedFullName: string) => {
    if (selectedFullName !== repoFullName) {
      router.push(`/${encodeRepoSlug(selectedFullName)}`);
    }
  };

  const navItemClass = (isActive: boolean) =>
    cn(
      "group motion-base flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
      collapsed && "lg:justify-center lg:px-0",
      isActive
        ? "border-sidebar-primary/35 bg-sidebar-primary/10 text-sidebar-primary shadow-sm"
        : "border-transparent text-sidebar-foreground/80 hover:-translate-y-[1px] hover:border-sidebar-border/85 hover:bg-sidebar-accent/85 hover:text-sidebar-foreground",
    );

  const contextSidebarTitle =
    contextSidebarMode === "design"
      ? "Designs"
      : contextSidebarMode === "sessions"
        ? "Sessions"
        : contextSidebarMode === "analyse"
          ? "Analyse"
          : contextSidebarMode === "admin"
            ? "Admin"
            : contextSidebarMode === "docs"
              ? "Documents"
              : contextSidebarMode === "testing-arena"
                ? "Testing Arena"
                : "";

  const showContextCreate = contextSidebarMode !== "admin";
  const contextCreateButtonTitle =
    contextSidebarMode === "design"
      ? "New design session"
      : contextSidebarMode === "sessions"
        ? "New session"
        : contextSidebarMode === "analyse"
          ? "New query"
          : contextSidebarMode === "docs"
            ? "New document"
            : contextSidebarMode === "testing-arena"
              ? "Test all"
              : "New item";

  const handleContextCreate = () => {
    if (contextSidebarMode === "design") {
      setDesignCreateRequestId((current) => current + 1);
      return;
    }
    if (contextSidebarMode === "sessions") {
      setSessionsCreateRequestId((current) => current + 1);
      return;
    }
    if (contextSidebarMode === "analyse") {
      setAnalyseCreateRequestId((current) => current + 1);
      return;
    }
    if (contextSidebarMode === "docs") {
      setDocsCreateRequestId((current) => current + 1);
      return;
    }
    if (contextSidebarMode === "testing-arena") {
      setTestingArenaCreateRequestId((current) => current + 1);
    }
  };

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-4  lg:hidden">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMobileOpen(true)}
          className="-ml-1"
        >
          <IconMenu2 size={20} className="text-muted-foreground" />
        </Button>
        <Link
          href={isRepoRoute && repoSlug ? `/${repoSlug}` : "/"}
          className="mx-auto flex items-center gap-2 rounded-lg border border-border/65 bg-card/75 px-2.5 py-1.5 shadow-sm "
        >
          <Image
            src="/icon.png"
            alt="Eva"
            width={22}
            height={22}
            className="rounded-full"
          />
          <span className="text-sm font-semibold tracking-[-0.02em] text-primary">
            Eva
          </span>
        </Link>
        <Button size="icon" variant="ghost" onClick={toggleTheme}>
          {theme === "dark" ? (
            <IconSun size={18} className="text-muted-foreground" />
          ) : (
            <IconMoon size={18} className="text-muted-foreground" />
          )}
        </Button>
      </header>

      <AnimatePresence>
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
          collapsed ? "w-80 lg:w-20" : "w-80",
        )}
      >
        <div className="h-full p-2 lg:p-3 lg:pr-2">
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-sidebar-border/60 bg-sidebar shadow-sm lg:bg-sidebar/92 ">
            <div
              className={cn(
                "flex h-16 items-center border-b border-sidebar-border/60 bg-sidebar-accent/20",
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
                    "flex w-full items-center",
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
                        <div className="flex min-w-0 items-center gap-2">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setContextSidebarMode("main")}
                            className="motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.97]"
                            title="Back to main sidebar"
                          >
                            <IconChevronLeft size={16} />
                          </Button>
                          <span className="truncate text-lg font-semibold tracking-[-0.02em] text-sidebar-primary">
                            {contextSidebarTitle}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {!collapsed && showContextCreate && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="motion-press hover:scale-[1.03] active:scale-[0.97]"
                            onClick={handleContextCreate}
                            title={contextCreateButtonTitle}
                          >
                            <IconPlus
                              size={18}
                              className="text-sidebar-primary"
                            />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="motion-press lg:hidden hover:scale-[1.03] active:scale-[0.97]"
                          onClick={closeMobileSidebar}
                        >
                          <IconX size={18} className="text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="motion-press hidden lg:inline-flex hover:scale-[1.03] active:scale-[0.97]"
                          onClick={() => setCollapsed(!collapsed)}
                          title={
                            collapsed ? "Expand sidebar" : "Collapse sidebar"
                          }
                        >
                          {collapsed ? (
                            <IconLayoutSidebarLeftCollapseFilled
                              size={18}
                              className="text-sidebar-primary"
                            />
                          ) : (
                            <IconLayoutSidebarLeftCollapse
                              size={18}
                              className="text-sidebar-primary"
                            />
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {!collapsed && (
                        <Link
                          href={isRepoRoute && repoSlug ? `/${repoSlug}` : "/"}
                          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sidebar-foreground"
                        >
                          <Image
                            src="/icon.png"
                            alt="Eva"
                            width={30}
                            height={30}
                            className="rounded-lg"
                          />
                          <span className="text-lg font-semibold tracking-[-0.02em] text-sidebar-primary">
                            Eva
                          </span>
                        </Link>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="motion-press lg:hidden hover:scale-[1.03] active:scale-[0.97]"
                          onClick={closeMobileSidebar}
                        >
                          <IconX size={18} className="text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="motion-press hidden lg:inline-flex hover:scale-[1.03] active:scale-[0.97]"
                          onClick={() => setCollapsed(!collapsed)}
                          title={
                            collapsed ? "Expand sidebar" : "Collapse sidebar"
                          }
                        >
                          {collapsed ? (
                            <IconLayoutSidebarLeftCollapseFilled
                              size={18}
                              className="text-sidebar-primary"
                            />
                          ) : (
                            <IconLayoutSidebarLeftCollapse
                              size={18}
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
                {!isRepoRoute && !collapsed && repos && repos.length > 0 && (
                  <div className="space-y-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-start gap-2 border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                          <IconBrandGithub
                            size={16}
                            className="text-muted-foreground"
                          />
                          <span className="flex-1 truncate text-left text-sm font-medium">
                            Select a repo
                          </span>
                          <IconSelector
                            size={16}
                            className="text-muted-foreground"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="max-h-72 overflow-auto scrollbar">
                        <DropdownMenuRadioGroup
                          onValueChange={handleRepoSelect}
                        >
                          {repos.map((repoItem) => {
                            const fullName = `${repoItem.owner}/${repoItem.name}`;
                            return (
                              <DropdownMenuRadioItem
                                key={fullName}
                                value={fullName}
                              >
                                <IconBrandGithub
                                  size={16}
                                  className="text-muted-foreground"
                                />
                                {fullName}
                              </DropdownMenuRadioItem>
                            );
                          })}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {isRepoRoute && repoSlug && repoFullName && (
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
                        collapsed ? null : contextSidebarMode === "admin" ? (
                          <AdminSidebar
                            repoSlug={repoSlug}
                            pathname={pathname}
                            onNavigate={closeMobileSidebar}
                          />
                        ) : repo ? (
                          contextSidebarMode === "design" ? (
                            <DesignSessionsSidebar
                              repoId={repo._id}
                              repoSlug={repoSlug}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                              createRequestId={designCreateRequestId}
                            />
                          ) : contextSidebarMode === "sessions" ? (
                            <SessionsSidebar
                              repoId={repo._id}
                              repoSlug={repoSlug}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                              createRequestId={sessionsCreateRequestId}
                              installationId={repo.installationId}
                            />
                          ) : contextSidebarMode === "docs" ? (
                            <DocsSidebar
                              repoId={repo._id}
                              repoSlug={repoSlug}
                              installationId={repo.installationId}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                              createRequestId={docsCreateRequestId}
                            />
                          ) : contextSidebarMode === "testing-arena" ? (
                            <TestingArenaSidebar
                              repoId={repo._id}
                              repoSlug={repoSlug}
                              installationId={repo.installationId}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                              createRequestId={testingArenaCreateRequestId}
                            />
                          ) : (
                            <AnalyseSidebar
                              repoId={repo._id}
                              repoSlug={repoSlug}
                              pathname={pathname}
                              onNavigate={closeMobileSidebar}
                              createRequestId={analyseCreateRequestId}
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
                            <div className="space-y-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full justify-start gap-2 border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground hover:bg-sidebar-accent"
                                  >
                                    <IconBrandGithub
                                      size={16}
                                      className="text-muted-foreground"
                                    />
                                    <span className="flex-1 truncate text-left text-sm font-medium">
                                      {repoFullName}
                                    </span>
                                    <IconSelector
                                      size={16}
                                      className="text-muted-foreground"
                                    />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="max-h-72 overflow-auto scrollbar">
                                  <DropdownMenuRadioGroup
                                    value={repoFullName}
                                    onValueChange={handleRepoSelect}
                                  >
                                    {(repos ?? []).map((repoItem) => {
                                      const fullName = `${repoItem.owner}/${repoItem.name}`;
                                      return (
                                        <DropdownMenuRadioItem
                                          key={fullName}
                                          value={fullName}
                                        >
                                          <IconBrandGithub
                                            size={16}
                                            className="text-muted-foreground"
                                          />
                                          {fullName}
                                        </DropdownMenuRadioItem>
                                      );
                                    })}
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}

                          <div className="space-y-2">
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
                                      return (
                                        <div
                                          key={item.name}
                                          className="relative"
                                        >
                                          <Link
                                            href={item.href}
                                            onClick={() => {
                                              setContextSidebarMode(
                                                contextMode,
                                              );
                                              closeMobileSidebar();
                                            }}
                                            className={cn(
                                              navItemClass(isActive),
                                              "pr-9",
                                            )}
                                          >
                                            <item.icon
                                              size={16}
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
                                          </Link>
                                          <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground hover:text-sidebar-foreground"
                                            onClick={(event) => {
                                              event.preventDefault();
                                              event.stopPropagation();
                                              setContextSidebarMode(
                                                contextMode,
                                              );
                                            }}
                                            title={`Open ${item.name.toLowerCase()} sidebar`}
                                          >
                                            <IconChevronRight size={14} />
                                          </Button>
                                        </div>
                                      );
                                    }

                                    return (
                                      <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => {
                                          if (contextMode) {
                                            setContextSidebarMode(contextMode);
                                          }
                                          closeMobileSidebar();
                                        }}
                                        title={
                                          collapsed ? item.name : undefined
                                        }
                                        className={navItemClass(isActive)}
                                      >
                                        <item.icon
                                          size={16}
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
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          {!collapsed && repo && (
                            <ActiveTasksAccordion
                              repoId={repo._id}
                              repoSlug={repoSlug}
                            />
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </nav>

            <div
              className={cn(
                "border-t border-sidebar-border/60 bg-sidebar-accent/32",
                collapsed ? "px-2 py-3" : "px-3 py-3",
              )}
            >
              <div
                className={cn(
                  "flex items-center",
                  collapsed ? "flex-col gap-2" : "gap-2 pr-2",
                )}
              >
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />

                {!collapsed && (
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground">
                    {user?.fullName || user?.firstName || "User"}
                  </p>
                )}
                <NotificationsPopoverClient />

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-sidebar-foreground"
                  title="Toggle theme"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <IconSun size={16} />
                  ) : (
                    <IconMoon size={16} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
