"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { IconSelector, IconBrandGithub } from "@tabler/icons-react";

export function RepoSwitcher() {
  const router = useRouter();
  const { repo, fullName } = useRepo();
  const repos = useQuery(api.githubRepos.list);

  const handleSelect = (selectedFullName: string) => {
    if (selectedFullName !== fullName) {
      router.push(`/${encodeRepoSlug(selectedFullName)}/plan`);
    }
  };

  if (!repos) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
        <div className="animate-pulse w-24 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          type="button"
        >
          <IconBrandGithub className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            {repo.owner}/{repo.name}
          </span>
          <IconSelector className="w-4 h-4 text-neutral-500" />
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Repository selection"
        selectionMode="single"
        selectedKeys={new Set([fullName])}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];
          if (typeof selected === "string") {
            handleSelect(selected);
          }
        }}
        className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg"
      >
        {repos.map((r) => {
          const repoFullName = `${r.owner}/${r.name}`;
          return (
            <DropdownItem
              key={repoFullName}
              className="px-3 py-2 text-sm text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700"
              startContent={
                <IconBrandGithub className="w-4 h-4 text-neutral-500" />
              }
            >
              {repoFullName}
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}
