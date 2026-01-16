"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { IconBrandGithub, IconCheck } from "@tabler/icons-react";
import { encodeRepoSlug, decodeRepoSlug } from "@/lib/utils/repoUrl";
import { useMemo } from "react";

export function RepoSwitcherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const repos = useQuery(api.githubRepos.list);

  const { repoSlug, currentSection } = useMemo(() => {
    const match = pathname.match(
      /^\/([^/]+)\/(plan|features|quick-tasks|sessions)/
    );
    if (match) {
      return { repoSlug: match[1], currentSection: match[2] };
    }
    return { repoSlug: null, currentSection: "plan" };
  }, [pathname]);

  const currentRepoFullName = repoSlug ? decodeRepoSlug(repoSlug) : null;

  const handleRepoClick = (fullName: string) => {
    const encodedSlug = encodeRepoSlug(fullName);
    router.push(`/${encodedSlug}/${currentSection}`);
  };

  if (!repos || repos.length === 0) {
    return null;
  }

  return (
    <aside className="hidden lg:flex fixed top-0 left-64 z-40 h-full w-14 flex-col items-center bg-neutral-100 dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 py-4">
      <div className="flex flex-col gap-2 items-center">
        {repos.map((repo) => {
          const fullName = `${repo.owner}/${repo.name}`;
          const isActive = fullName === currentRepoFullName;
          const initials = repo.name
            .split(/[-_]/)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase() || "")
            .join("");

          return (
            <button
              key={repo._id}
              onClick={() => handleRepoClick(fullName)}
              title={fullName}
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                isActive
                  ? "bg-pink-600 text-white shadow-md"
                  : "bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600"
              }`}
            >
              {initials || <IconBrandGithub className="w-5 h-5" />}
              {isActive && (
                <span className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-100 dark:border-neutral-800" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-auto">
        <Link
          href="/repos"
          title="All Repositories"
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600 border-dashed"
        >
          <IconBrandGithub className="w-5 h-5" />
        </Link>
      </div>
    </aside>
  );
}
