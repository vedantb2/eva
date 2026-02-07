"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  IconBrain,
  IconBrandGithub,
  IconLayoutKanban,
  IconSettings,
  IconMenu2,
  IconX,
  IconChecklist,
  IconSelector,
  IconTerminal2,
  IconFileText,
  IconShield,
  IconChevronDown,
  IconFlask,
  IconHammer,
  IconTool,
  IconTestPipe,
  IconChartBar,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftCollapseFilled,
} from "@tabler/icons-react";
import { useState, useMemo, useEffect } from "react";
import { decodeRepoSlug, encodeRepoSlug } from "@/lib/utils/repoUrl";
import { ActiveTasksAccordion } from "@/lib/components/sidebar/ActiveTasksAccordion";
import { BranchSelector } from "@/lib/components/sidebar/BranchSelector";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { ThemeToggleClient } from "@/lib/components/ThemeToggleClient";
import { useQuery } from "convex/react";
import { api } from "conductor-backend";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Button,
} from "@conductor/ui";
import { NotificationsPopoverClient } from "@/lib/components/NotificationsPopoverClient";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();
  const repos = useQuery(api.githubRepos.list);
  const { user } = useUser();
  const [expandedGroups, setExpandedGroups] = useState(
    new Set(["BUILD", "FIX", "TEST", "DATA"]),
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const repoSlug = useMemo(() => {
    const match = pathname.match(/^\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const repoFullName = repoSlug ? decodeRepoSlug(repoSlug) : null;
  const [owner, name] = repoFullName ? repoFullName.split("/") : [null, null];

  const handleRepoSelect = (selectedFullName: string) => {
    if (selectedFullName !== repoFullName) {
      router.push(`/${encodeRepoSlug(selectedFullName)}/projects`);
    }
  };

  const repo = useQuery(
    api.githubRepos.getByOwnerAndName,
    owner && name ? { owner, name } : "skip",
  );

  const repoNavigation = repoSlug
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
            { name: "Analyse", href: `/${repoSlug}/analyse`, icon: IconBrain },
          ],
        },
      ]
    : [];

  useEffect(() => {
    const activeGroup = repoNavigation.find((g) =>
      g.items.some((item) => pathname.startsWith(item.href)),
    );
    if (activeGroup && !expandedGroups.has(activeGroup.label)) {
      setExpandedGroups((prev) => new Set(prev).add(activeGroup.label));
    }
  }, [pathname, repoNavigation, expandedGroups]);

  const bottomNavigation = [
    ...(repoSlug
      ? [{ name: "Admin", href: `/${repoSlug}/admin`, icon: IconShield }]
      : []),
    { name: "Settings", href: "/settings", icon: IconSettings },
  ];

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMobileOpen(true)}
          className="-ml-2"
        >
          <IconMenu2 className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        </Button>
        <Link
          href={repoSlug ? `/${repoSlug}` : "/"}
          className={`flex items-center gap-1.5 mx-auto`}
        >
          <Image
            src="/icon.png"
            alt="Eva"
            width={22}
            height={22}
            className="rounded-full"
          />
          <span className="text-md tracking-tight font-semibold text-primary">
            Eva
          </span>
        </Link>
        <ThemeToggleClient />
      </header>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-neutral-100 dark:bg-neutral-950 transform transition-all duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-16" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`flex items-center h-14 ${collapsed ? "lg:justify-center lg:px-0 px-4" : "justify-between px-4"}`}
          >
            {!collapsed && (
              <Link
                href={repoSlug ? `/${repoSlug}` : "/"}
                className="flex items-center gap-1.5"
              >
                <Image
                  src="/icon.png"
                  alt="Eva"
                  width={30}
                  height={30}
                  className="rounded-full"
                />
                <span className="text-xl tracking-tight font-semibold text-primary">
                  Eva
                </span>
              </Link>
            )}
            <Button
              size="icon"
              variant="secondary"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden"
            >
              <IconX className="w-5 h-5 text-neutral-500" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCollapsed(!collapsed)}
              className={`hidden lg:flex ${collapsed ? "absolute" : ""}`}
            >
              {collapsed ? (
                <IconLayoutSidebarLeftCollapseFilled className="size-5 text-primary" />
              ) : (
                <IconLayoutSidebarLeftCollapse className="size-5 text-primary" />
              )}
            </Button>
          </div>

          <nav
            className={`flex-1 pt-2 pb-4 overflow-y-auto scrollbar flex flex-col justify-between ${collapsed ? "lg:px-2 px-3" : "px-3"}`}
          >
            <div>
              {repoSlug && repoFullName && (
                <>
                  {!collapsed && (
                    <div className="mb-4 space-y-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex items-center gap-2 w-full"
                          >
                            <IconBrandGithub className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                            <span className="flex-1 text-left text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {repoFullName}
                            </span>
                            <IconSelector className="w-4 h-4 text-neutral-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuRadioGroup
                            value={repoFullName}
                            onValueChange={handleRepoSelect}
                          >
                            {(repos ?? []).map((r) => {
                              const rFullName = `${r.owner}/${r.name}`;
                              return (
                                <DropdownMenuRadioItem
                                  key={rFullName}
                                  value={rFullName}
                                  className="px-3 py-2 text-sm"
                                >
                                  <IconBrandGithub className="mr-2 h-4 w-4 text-neutral-500" />
                                  {rFullName}
                                </DropdownMenuRadioItem>
                              );
                            })}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {repo && (
                        <BranchSelector
                          owner={repo.owner}
                          repoName={repo.name}
                          installationId={repo.installationId}
                        />
                      )}
                    </div>
                  )}
                  <div className="space-y-3">
                    {repoNavigation.map((group) => (
                      <div key={group.label}>
                        {!collapsed && (
                          <button
                            onClick={() => toggleGroup(group.label)}
                            className="flex items-center gap-1.5 py-0.5 mb-1 w-full text-[10px] font-semibold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                          >
                            <group.groupIcon className="w-3 h-3" />
                            {group.label}
                            <IconChevronDown
                              className={`w-3 h-3 transition-transform ${expandedGroups.has(group.label) ? "" : "-rotate-90"}`}
                            />
                          </button>
                        )}
                        {(collapsed || expandedGroups.has(group.label)) && (
                          <div
                            className={`space-y-0.5 ${collapsed ? "" : "pl-2"}`}
                          >
                            {group.items.map((item) => {
                              const isActive = pathname.startsWith(item.href);
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  onClick={() => setMobileOpen(false)}
                                  title={collapsed ? item.name : undefined}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${collapsed ? "lg:justify-center lg:px-0" : ""} ${
                                    isActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                                  }`}
                                >
                                  <item.icon
                                    className={`size-[16px] flex-shrink-0 ${
                                      isActive ? "text-primary" : ""
                                    }`}
                                  />
                                  {!collapsed && item.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!collapsed && repo && repoSlug && (
                    <div className="mt-6">
                      <ActiveTasksAccordion
                        repoId={repo._id}
                        repoSlug={repoSlug}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1">
              {bottomNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${collapsed ? "lg:justify-center lg:px-0" : ""} ${
                      isActive
                        ? "bg-primary/5 text-primary"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <item.icon
                      className={`size-[16px] flex-shrink-0 ${isActive ? "text-primary" : ""}`}
                    />
                    {!collapsed && item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div
            className={`pt-3 mt-2 ${collapsed ? "lg:p-2 p-4" : "px-4 py-3"}`}
          >
            <div
              className={`flex items-center ${collapsed ? "lg:justify-center lg:flex-col lg:gap-2" : "gap-3"}`}
            >
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
              {!collapsed && (
                <>
                  <p className="flex-1 min-w-0 text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {user?.fullName || user?.firstName || "User"}
                  </p>
                  <ThemeToggleClient />
                  <NotificationsPopoverClient />
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
