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
  IconChevronLeft,
  IconChevronRight,
  IconFlask,
  IconBell,
} from "@tabler/icons-react";
import { useState, useMemo, useEffect } from "react";
import { decodeRepoSlug, encodeRepoSlug } from "@/lib/utils/repoUrl";
import { ActiveTasksAccordion } from "@/lib/components/sidebar/ActiveTasksAccordion";
import { BranchSelector } from "@/lib/components/sidebar/BranchSelector";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { ThemeToggleClient } from "@/lib/components/ThemeToggleClient";
import { useQuery } from "convex/react";
import { api } from "@/api";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

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
    const match = pathname.match(
      /^\/([^/]+)\/(projects|quick-tasks|sessions|docs|admin|analyse|testing-arena|notifications)/,
    );
    if (match) {
      return match[1];
    }
    return null;
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

  const unreadCount = useQuery(api.notifications.countUnread) ?? 0;

  const bottomNavigation = [
    { name: "Notifications", href: `/${repoSlug}/notifications`, icon: IconBell },
    ...(repoSlug
      ? [{ name: "Admin", href: `/${repoSlug}/admin`, icon: IconShield }]
      : []),
    { name: "Settings", href: "/settings", icon: IconSettings },
  ];

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <IconMenu2 className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        </button>
        <Link
          href="/"
          className={`flex items-center gap-1.5 bg-gradient-to-r from-teal-200/50 to-cyan-200/50 dark:from-teal-800 dark:to-cyan-800 rounded-full pr-4 mx-auto`}
        >
          <Image
            src="/icon.png"
            alt="Eva"
            width={22}
            height={22}
            className="rounded-full"
          />
          <span className="text-md tracking-tight font-semibold text-teal-800 dark:text-teal-100">
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
        className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transform transition-all duration-200 ease-in-out lg:translate-x-0 py-1 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-16" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`flex items-center h-16 border-b border-neutral-200 dark:border-neutral-800 ${collapsed ? "lg:justify-center lg:px-0 px-4" : "justify-between px-4"}`}
          >
            <Link
              href="/"
              className={`flex items-center gap-1.5 ${collapsed ? "lg:justify-center" : "bg-gradient-to-r from-teal-200/50 to-cyan-200/50 dark:from-teal-800 dark:to-cyan-800 rounded-full pr-4 mx-auto"}`}
            >
              <Image
                src="/icon.png"
                alt="Eva"
                width={30}
                height={30}
                className="rounded-full"
              />
              {!collapsed && (
                <span className="text-xl tracking-tight font-semibold text-teal-800 dark:text-teal-100">
                  Eva
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <IconX className="w-5 h-5 text-neutral-500" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`hidden lg:flex p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 ${collapsed ? "absolute right-2" : ""}`}
            >
              {collapsed ? (
                <IconChevronRight className="w-5 h-5 text-neutral-500" />
              ) : (
                <IconChevronLeft className="w-5 h-5 text-neutral-500" />
              )}
            </button>
          </div>

          <nav
            className={`flex-1 py-4 overflow-y-auto scrollbar flex flex-col justify-between ${collapsed ? "lg:px-2 px-3" : "px-3"}`}
          >
            <div>
              {repoSlug && repoFullName && (
                <>
                  {!collapsed && (
                    <div className="mb-4 space-y-2">
                      <Dropdown>
                        <DropdownTrigger>
                          <button
                            className="flex items-center gap-2 w-full px-2 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            type="button"
                          >
                            <IconBrandGithub className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                            <span className="flex-1 text-left text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {repoFullName}
                            </span>
                            <IconSelector className="w-4 h-4 text-neutral-500" />
                          </button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Repository selection"
                          selectionMode="single"
                          selectedKeys={new Set([repoFullName])}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0];
                            if (typeof selected === "string") {
                              handleRepoSelect(selected);
                            }
                          }}
                          className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg"
                        >
                          {(repos ?? []).map((r) => {
                            const rFullName = `${r.owner}/${r.name}`;
                            return (
                              <DropdownItem
                                key={rFullName}
                                className="px-3 py-2 text-sm text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                startContent={
                                  <IconBrandGithub className="w-4 h-4 text-neutral-500" />
                                }
                              >
                                {rFullName}
                              </DropdownItem>
                            );
                          })}
                        </DropdownMenu>
                      </Dropdown>
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
                            className="flex items-center gap-1 py-0.5 mb-1 w-full text-[10px] font-semibold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                          >
                            <IconChevronDown
                              className={`w-3 h-3 transition-transform ${expandedGroups.has(group.label) ? "" : "-rotate-90"}`}
                            />
                            {group.label}
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
                                      ? "bg-teal-100/80 dark:bg-teal-900/20 text-teal-800 dark:text-teal-200"
                                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                                  }`}
                                >
                                  <item.icon
                                    className={`w-5 h-5 flex-shrink-0 ${
                                      isActive
                                        ? "text-teal-800 dark:text-teal-200"
                                        : ""
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
                const showBadge =
                  item.name === "Notifications" && unreadCount > 0;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${collapsed ? "lg:justify-center lg:px-0" : ""} ${
                      isActive
                        ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="relative flex-shrink-0">
                      <item.icon
                        className={`w-5 h-5 ${isActive ? "text-teal-600" : ""}`}
                      />
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-teal-600 rounded-full">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </span>
                    {!collapsed && item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div
            className={`border-t border-neutral-200 dark:border-neutral-800 ${collapsed ? "lg:p-2 p-4" : "p-4"}`}
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
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
