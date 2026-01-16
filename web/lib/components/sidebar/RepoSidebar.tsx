"use client";

import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { encodeRepoSlug, decodeRepoSlug } from "@/lib/utils/repoUrl";
import { IconBrandGithub, IconPlus } from "@tabler/icons-react";
import { Tooltip } from "@heroui/react";
import { useMemo } from "react";

interface RepoSidebarProps {
  currentRepoSlug: string;
}

export function RepoSidebar({ currentRepoSlug }: RepoSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const repos = useQuery(api.githubRepos.list);

  const currentFullName = decodeRepoSlug(currentRepoSlug);

  const currentSection = useMemo(() => {
    const match = pathname.match(
      /^\/[^/]+\/(plan|features|quick-tasks|sessions)/
    );
    return match ? match[1] : "plan";
  }, [pathname]);

  const handleRepoSelect = (fullName: string) => {
    if (fullName !== currentFullName) {
      router.push(`/${encodeRepoSlug(fullName)}/${currentSection}`);
    }
  };

  const getRepoInitials = (fullName: string) => {
    const name = fullName.split("/")[1] || fullName;
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="hidden lg:flex flex-col w-14 bg-neutral-100 dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700">
      <div className="flex-1 py-3 px-2 space-y-2 overflow-y-auto">
        {(repos ?? []).map((repo) => {
          const fullName = `${repo.owner}/${repo.name}`;
          const isActive = fullName === currentFullName;

          return (
            <Tooltip
              key={fullName}
              content={fullName}
              placement="right"
              delay={300}
              closeDelay={0}
            >
              <button
                onClick={() => handleRepoSelect(fullName)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-pink-600 text-white shadow-md"
                    : "bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600"
                }`}
              >
                {getRepoInitials(fullName)}
              </button>
            </Tooltip>
          );
        })}
      </div>

      <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
        <Tooltip content="Add repository" placement="right" delay={300} closeDelay={0}>
          <button
            onClick={() => router.push("/repos")}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600 border-dashed transition-colors"
          >
            <IconPlus className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
