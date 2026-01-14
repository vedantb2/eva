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
  IconSparkles,
  IconChecklist,
  IconSelector,
  IconTerminal2,
} from "@tabler/icons-react";
import { useState, useMemo } from "react";
import { decodeRepoSlug, encodeRepoSlug } from "@/lib/utils/repoUrl";
import { ActiveTasksAccordion } from "@/lib/components/sidebar/ActiveTasksAccordion";
import { BranchSelector } from "@/lib/components/sidebar/BranchSelector";
import { ThemeToggleClient } from "@/lib/components/ThemeToggleClient";
import { useQuery } from "convex/react";
import { api } from "@/api";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

const mainNavigation = [
  { name: "Repositories", href: "/repos", icon: IconBrandGithub },
  { name: "Settings", href: "/settings", icon: IconSettings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const repos = useQuery(api.githubRepos.list);
  const { user } = useUser();

  const repoSlug = useMemo(() => {
    const match = pathname.match(
      /^\/([^/]+)\/(plan|features|quick-tasks|sessions)/
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
      router.push(`/${encodeRepoSlug(selectedFullName)}/plan`);
    }
  };

  const repo = useQuery(
    api.githubRepos.getByOwnerAndName,
    owner && name ? { owner, name } : "skip"
  );

  const repoNavigation = repoSlug
    ? [
        {
          name: "Plan",
          href: `/${repoSlug}/plan`,
          icon: IconSparkles,
        },
        {
          name: "Features",
          href: `/${repoSlug}/features`,
          icon: IconLayoutKanban,
        },
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
      ]
    : [];

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <IconMenu2 className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="Conductor" width={24} height={24} />
          <span className="text-base font-semibold text-neutral-900 dark:text-white">
            Conductor
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
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-neutral-800">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon.png" alt="Conductor" width={32} height={32} />
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                Conductor
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <IconX className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col justify-between">
            <div>
              {repoSlug && repoFullName && (
                <>
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
                  <div className="space-y-1">
                    {repoNavigation.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          <item.icon
                            className={`w-5 h-5 ${
                              isActive ? "text-pink-600" : ""
                            }`}
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>

                  {repo && (
                    <div className="mt-6">
                      <ActiveTasksAccordion repoId={repo._id} />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1">
              {mainNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 ${isActive ? "text-pink-600" : ""}`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
              <p className="flex-1 min-w-0 text-sm font-medium text-neutral-900 dark:text-white truncate">
                {user?.fullName || user?.firstName || "User"}
              </p>
              <ThemeToggleClient />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
