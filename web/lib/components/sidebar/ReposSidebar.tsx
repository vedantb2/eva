"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { IconBrandGithub, IconPlus } from "@tabler/icons-react";
import { encodeRepoSlug, decodeRepoSlug } from "@/lib/utils/repoUrl";
import { Tooltip } from "@heroui/react";
import { useMemo } from "react";

export function ReposSidebar() {
  const pathname = usePathname();
  const repos = useQuery(api.githubRepos.list);

  const currentRepoSlug = useMemo(() => {
    const match = pathname.match(
      /^\/([^/]+)\/(plan|features|quick-tasks|sessions)/
    );
    if (match) {
      return match[1];
    }
    return null;
  }, [pathname]);

  const currentSection = useMemo(() => {
    const match = pathname.match(
      /^\/[^/]+\/(plan|features|quick-tasks|sessions)/
    );
    return match ? match[1] : "plan";
  }, [pathname]);

  const currentFullName = currentRepoSlug
    ? decodeRepoSlug(currentRepoSlug)
    : null;

  if (!repos) {
    return (
      <aside className="hidden lg:flex flex-col w-14 bg-neutral-100 dark:bg-neutral-800/50 border-r border-neutral-200 dark:border-neutral-700">
        <div className="flex-1 py-3 flex flex-col items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse"
            />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-14 bg-neutral-100 dark:bg-neutral-800/50 border-r border-neutral-200 dark:border-neutral-700">
      <div className="flex-1 py-3 flex flex-col items-center gap-2 overflow-y-auto">
        {repos.map((repo) => {
          const fullName = `${repo.owner}/${repo.name}`;
          const slug = encodeRepoSlug(fullName);
          const isActive = fullName === currentFullName;
          const href = `/${slug}/${currentSection}`;
          const initials = repo.name.slice(0, 2).toUpperCase();

          return (
            <Tooltip
              key={repo._id}
              content={fullName}
              placement="right"
              delay={0}
              closeDelay={0}
            >
              <Link
                href={href}
                className={`relative flex items-center justify-center w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-pink-600 text-white shadow-md"
                    : "bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                }`}
              >
                {isActive && (
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-pink-600 rounded-r-full" />
                )}
                {initials}
              </Link>
            </Tooltip>
          );
        })}
      </div>
      <div className="py-3 flex flex-col items-center border-t border-neutral-200 dark:border-neutral-700">
        <Tooltip content="View all repos" placement="right" delay={0} closeDelay={0}>
          <Link
            href="/repos"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
          >
            <IconBrandGithub className="w-5 h-5" />
          </Link>
        </Tooltip>
      </div>
    </aside>
  );
}
