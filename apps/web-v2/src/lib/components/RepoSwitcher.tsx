"use client";

import { useMemo, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  cn,
} from "@conductor/ui";
import {
  IconBrandGithub,
  IconChevronRight,
  IconFolder,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react";
import type { Doc } from "@conductor/backend";

interface RepoSwitcherProps {
  repos: Doc<"githubRepos">[];
  currentOwner: string | null;
  currentName: string | null;
  currentAppName: string | undefined;
  onSelect: (owner: string, name: string, rootDirectory?: string) => void;
  className?: string;
}

interface UniqueRepo {
  owner: string;
  name: string;
  apps: Doc<"githubRepos">[];
}

export function RepoSwitcher({
  repos,
  currentOwner,
  currentName,
  currentAppName,
  onSelect,
  className,
}: RepoSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<string | null>(
    currentOwner,
  );
  const [selectedMonorepo, setSelectedMonorepo] = useState<string | null>(null);

  const reposByOwner = useMemo(() => {
    const map = new Map<string, UniqueRepo[]>();

    const repoMap = new Map<string, UniqueRepo>();
    for (const repo of repos) {
      const key = `${repo.owner}/${repo.name}`;
      const existing = repoMap.get(key);
      if (existing) {
        if (repo.rootDirectory) {
          existing.apps.push(repo);
        }
      } else {
        repoMap.set(key, {
          owner: repo.owner,
          name: repo.name,
          apps: repo.rootDirectory ? [repo] : [],
        });
      }
    }

    for (const repo of repoMap.values()) {
      const list = map.get(repo.owner) ?? [];
      list.push(repo);
      map.set(repo.owner, list);
    }

    for (const [ownerKey, list] of map) {
      map.set(
        ownerKey,
        list.sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    return map;
  }, [repos]);

  const filteredReposByOwner = useMemo(() => {
    if (!search.trim()) return reposByOwner;

    const term = search.toLowerCase();
    const filtered = new Map<string, UniqueRepo[]>();

    for (const [ownerKey, ownerRepos] of reposByOwner) {
      const matching = ownerRepos.filter((r) =>
        r.name.toLowerCase().includes(term),
      );
      if (matching.length > 0) {
        filtered.set(ownerKey, matching);
      }
    }

    return filtered;
  }, [reposByOwner, search]);

  const filteredOwners = useMemo(
    () => [...filteredReposByOwner.keys()].sort(),
    [filteredReposByOwner],
  );

  const effectiveOwner = useMemo(() => {
    if (filteredOwners.length === 1) return filteredOwners[0];
    if (selectedOwner && filteredReposByOwner.has(selectedOwner))
      return selectedOwner;
    return filteredOwners[0] ?? null;
  }, [filteredOwners, selectedOwner, filteredReposByOwner]);

  const visibleRepos = effectiveOwner
    ? (filteredReposByOwner.get(effectiveOwner) ?? [])
    : [];

  const monorepoApps =
    selectedMonorepo && effectiveOwner
      ? (visibleRepos.find(
          (r) => r.owner === effectiveOwner && r.name === selectedMonorepo,
        )?.apps ?? [])
      : [];

  const showAppsColumn = monorepoApps.length > 0;

  const displayLabel =
    currentOwner && currentName ? currentName : "Select a repo";

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSearch("");
      setSelectedOwner(currentOwner);
      setSelectedMonorepo(null);
    }
  };

  const handleRepoClick = (repo: UniqueRepo) => {
    if (repo.apps.length > 0) {
      setSelectedMonorepo(repo.name);
    } else {
      onSelect(repo.owner, repo.name);
      setOpen(false);
    }
  };

  const handleAppClick = (app: Doc<"githubRepos">) => {
    onSelect(app.owner, app.name, app.rootDirectory);
    setOpen(false);
  };

  const itemClass = (active: boolean) =>
    cn(
      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
      active
        ? "bg-sidebar-primary/10 text-sidebar-primary"
        : "text-foreground/80 hover:bg-accent/60",
    );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className={className}>
          <IconBrandGithub size={16} className="text-muted-foreground" />
          <span className="flex-1 truncate text-left text-sm font-medium">
            {displayLabel}
          </span>
          <IconSelector size={16} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "p-0 transition-[width] duration-200",
          showAppsColumn ? "w-[580px]" : "w-[400px]",
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <IconSearch size={14} className="shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedMonorepo(null);
            }}
            placeholder="Search repos..."
            className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="flex">
          <div className="scrollbar w-[130px] shrink-0 overflow-y-auto bg-muted/30 py-1 pl-1">
            {filteredOwners.map((ownerKey) => (
              <div
                key={ownerKey}
                onClick={() => {
                  setSelectedOwner(ownerKey);
                  setSelectedMonorepo(null);
                }}
                className={itemClass(ownerKey === effectiveOwner)}
              >
                <span className="truncate">{ownerKey}</span>
              </div>
            ))}
            {filteredOwners.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No matches
              </p>
            )}
          </div>

          <div className="scrollbar min-w-0 flex-1 overflow-y-auto py-1 pl-1">
            {visibleRepos.map((repo) => {
              const isSelected =
                repo.owner === currentOwner && repo.name === currentName;
              const isMonorepo = repo.apps.length > 0;
              const isMonorepoExpanded = selectedMonorepo === repo.name;

              return (
                <div
                  key={`${repo.owner}/${repo.name}`}
                  onClick={() => handleRepoClick(repo)}
                  className={cn(
                    itemClass(isSelected || isMonorepoExpanded),
                    "justify-between",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <IconBrandGithub
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="truncate">{repo.name}</span>
                  </div>
                  {isMonorepo && (
                    <IconChevronRight
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                  )}
                </div>
              );
            })}
            {visibleRepos.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No repos
              </p>
            )}
          </div>

          {showAppsColumn && (
            <div className="scrollbar w-[140px] shrink-0 overflow-y-auto bg-muted/30 py-1 pr-1">
              {monorepoApps.map((app) => {
                const appLabel =
                  app.rootDirectory?.split("/").pop() ?? app.name;
                const isSelected = currentAppName === appLabel;

                return (
                  <div
                    key={app._id}
                    onClick={() => handleAppClick(app)}
                    className={itemClass(isSelected)}
                  >
                    <IconFolder
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="truncate">{appLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
