"use client";

import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from "@conductor/ui";
import { IconBrandGithub, IconSelector } from "@tabler/icons-react";
import type { Doc } from "@conductor/backend";
import { repoHref } from "@/lib/utils/repoUrl";

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
  const groups = useMemo(() => {
    const byOwner: Record<string, Record<string, Doc<"githubRepos">[]>> = {};

    for (const repo of repos) {
      if (!byOwner[repo.owner]) byOwner[repo.owner] = {};
      if (!byOwner[repo.owner][repo.name]) byOwner[repo.owner][repo.name] = [];
      byOwner[repo.owner][repo.name].push(repo);
    }

    return Object.keys(byOwner)
      .sort()
      .map((owner) => ({
        owner,
        repoGroups: Object.keys(byOwner[owner])
          .sort()
          .map((name) => ({
            name,
            entries: byOwner[owner][name],
          })),
      }));
  }, [repos]);

  const selectedRepo = repos.find(
    (r) => repoHref(r.owner, r.name, r.rootDirectory) === value,
  );

  const displayLabel = selectedRepo
    ? selectedRepo.rootDirectory
      ? `${selectedRepo.name}/${selectedRepo.rootDirectory.split("/").pop()}`
      : selectedRepo.name
    : placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className={className}>
          <IconBrandGithub size={16} className="text-muted-foreground" />
          <span className="flex-1 truncate text-left text-sm font-medium">
            {displayLabel}
          </span>
          <IconSelector size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 overflow-auto scrollbar">
        {groups.map((group, index) => (
          <DropdownMenuGroup key={group.owner}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{group.owner}</DropdownMenuLabel>
            {group.repoGroups.map((rg) => {
              const isMonorepo = rg.entries.some((r) => r.rootDirectory);

              if (!isMonorepo) {
                const repo = rg.entries[0];
                const href = repoHref(
                  repo.owner,
                  repo.name,
                  repo.rootDirectory,
                );
                return (
                  <DropdownMenuItem
                    key={repo._id}
                    className={href === value ? "bg-accent/80" : ""}
                    onSelect={() => onValueChange(href)}
                  >
                    <IconBrandGithub
                      size={16}
                      className="text-muted-foreground"
                    />
                    {repo.name}
                  </DropdownMenuItem>
                );
              }

              return (
                <div key={rg.name}>
                  <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground/70 pl-3">
                    {rg.name}
                  </DropdownMenuLabel>
                  {rg.entries.map((repo) => {
                    const href = repoHref(
                      repo.owner,
                      repo.name,
                      repo.rootDirectory,
                    );
                    const appName =
                      repo.rootDirectory?.split("/").pop() ?? repo.name;
                    return (
                      <DropdownMenuItem
                        key={repo._id}
                        className={href === value ? "bg-accent/80" : ""}
                        onSelect={() => onValueChange(href)}
                      >
                        <IconBrandGithub
                          size={16}
                          className="text-muted-foreground"
                        />
                        {`${rg.name}/${appName}`}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              );
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
