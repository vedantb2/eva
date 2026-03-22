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

interface RepoSwitcherProps {
  repos: Doc<"githubRepos">[];
  currentOwner: string | null;
  currentName: string | null;
  onSelect: (owner: string, name: string) => void;
  className?: string;
}

export function RepoSwitcher({
  repos,
  currentOwner,
  currentName,
  onSelect,
  className,
}: RepoSwitcherProps) {
  const groups = useMemo(() => {
    const uniqueRepos = new Map<string, { owner: string; name: string }>();
    for (const repo of repos) {
      const key = `${repo.owner}/${repo.name}`;
      if (!uniqueRepos.has(key)) {
        uniqueRepos.set(key, { owner: repo.owner, name: repo.name });
      }
    }

    const byOwner: Record<string, { owner: string; name: string }[]> = {};
    for (const r of uniqueRepos.values()) {
      if (!byOwner[r.owner]) byOwner[r.owner] = [];
      byOwner[r.owner].push(r);
    }

    return Object.keys(byOwner)
      .sort()
      .map((owner) => ({
        owner,
        repos: byOwner[owner].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [repos]);

  const displayLabel =
    currentOwner && currentName ? currentName : "Select a repo";

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
            {group.repos.map((r) => {
              const isSelected =
                r.owner === currentOwner && r.name === currentName;
              return (
                <DropdownMenuItem
                  key={`${r.owner}/${r.name}`}
                  className={isSelected ? "bg-accent/80" : ""}
                  onSelect={() => onSelect(r.owner, r.name)}
                >
                  <IconBrandGithub
                    size={16}
                    className="text-muted-foreground"
                  />
                  {r.name}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
