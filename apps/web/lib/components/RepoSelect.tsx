"use client";

import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from "@conductor/ui";
import { IconBrandGithub, IconSelector } from "@tabler/icons-react";
import type { Doc } from "@conductor/backend";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";

interface RepoSelectProps {
  repos: Doc<"githubRepos">[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RepoSelect({
  repos,
  value,
  onValueChange,
  placeholder = "Select a repo",
  className,
}: RepoSelectProps) {
  const reposByOwner = useMemo(() => {
    const grouped = repos.reduce(
      (acc, repo) => {
        if (!acc[repo.owner]) {
          acc[repo.owner] = [];
        }
        acc[repo.owner].push(repo);
        return acc;
      },
      {} as Record<string, Doc<"githubRepos">[]>,
    );

    return Object.keys(grouped)
      .sort()
      .map((owner) => ({
        owner,
        repos: grouped[owner].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [repos]);

  const displayValue = value || placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className={className}>
          <IconBrandGithub size={16} className="text-muted-foreground" />
          <span className="flex-1 truncate text-left text-sm font-medium">
            {displayValue}
          </span>
          <IconSelector size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 overflow-auto scrollbar">
        <DropdownMenuRadioGroup
          value={value || ""}
          onValueChange={onValueChange}
        >
          {reposByOwner.map((group, index) => (
            <DropdownMenuGroup key={group.owner}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{group.owner}</DropdownMenuLabel>
              {group.repos.map((repo) => {
                const fullName = `${repo.owner}/${repo.name}`;
                const slug = encodeRepoSlug(fullName, repo.rootDirectory);
                return (
                  <DropdownMenuRadioItem key={repo._id} value={slug}>
                    <IconBrandGithub
                      size={16}
                      className="text-muted-foreground"
                    />
                    <span className="flex flex-col">
                      <span>{repo.name}</span>
                      {repo.rootDirectory && (
                        <span className="text-[10px] text-muted-foreground">
                          {repo.rootDirectory}
                        </span>
                      )}
                    </span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
