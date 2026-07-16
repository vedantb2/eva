"use client";

import { useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent, cn } from "@conductor/ui";
import {
  IconBrandGithub,
  IconChevronRight,
  IconFolder,
  IconSearch,
  IconSelector,
  IconUser,
} from "@tabler/icons-react";
import type { Doc } from "@conductor/backend";
import { RepoLogo } from "@/lib/components/RepoLogo";

type RepoWithLogo = Doc<"githubRepos"> & { logoUrl?: string | null };

const AVATAR_PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-orange-500",
];

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % AVATAR_PALETTE.length;
  }
  return AVATAR_PALETTE[hash];
}

function OwnerAvatar({ owner }: { owner: string }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md text-sm font-semibold text-white",
        getAvatarColor(owner),
      )}
    >
      <span>{owner.charAt(0).toUpperCase()}</span>
      {!imgError && (
        <img
          src={`https://github.com/${encodeURIComponent(owner)}.png?size=72`}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}

/** Matches a monorepo app row to the URL `appName` segment. */
function appMatchesLabel(app: RepoWithLogo, appName: string): boolean {
  const leaf = app.rootDirectory?.split("/").pop();
  return leaf === appName || app.rootDirectory === appName;
}

interface RepoSwitcherProps {
  repos: RepoWithLogo[];
  currentOwner: string | null;
  currentName: string | null;
  currentAppName: string | undefined;
  onSelect: (owner: string, name: string, rootDirectory?: string) => void;
  className?: string;
}

interface UniqueRepo {
  owner: string;
  name: string;
  /** Root (non-app) doc when the repo itself is selectable. */
  root: RepoWithLogo | null;
  apps: RepoWithLogo[];
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
        } else {
          existing.root = repo;
        }
      } else {
        repoMap.set(key, {
          owner: repo.owner,
          name: repo.name,
          root: repo.rootDirectory ? null : repo,
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
    currentOwner && currentName
      ? currentAppName
        ? `${currentName}/${currentAppName}`
        : currentName
      : "Select a repo";

  const currentIsMonorepo = useMemo(() => {
    if (!currentOwner || !currentName) return false;
    return repos.some(
      (r) =>
        r.owner === currentOwner && r.name === currentName && r.rootDirectory,
    );
  }, [repos, currentOwner, currentName]);

  const currentLogoUrl = useMemo(() => {
    if (!currentOwner || !currentName) return null;
    if (currentAppName) {
      const app = repos.find(
        (r) =>
          r.owner === currentOwner &&
          r.name === currentName &&
          r.rootDirectory &&
          appMatchesLabel(r, currentAppName),
      );
      return app?.logoUrl ?? null;
    }
    const root = repos.find(
      (r) =>
        r.owner === currentOwner && r.name === currentName && !r.rootDirectory,
    );
    return root?.logoUrl ?? null;
  }, [repos, currentOwner, currentName, currentAppName]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSearch("");
      setSelectedOwner(currentOwner);
      setSelectedMonorepo(currentIsMonorepo ? currentName : null);
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

  const handleAppClick = (app: RepoWithLogo) => {
    onSelect(app.owner, app.name, app.rootDirectory);
    setOpen(false);
  };

  const itemClass = (active: boolean) =>
    cn(
      "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
      active
        ? "bg-sidebar-primary/10 text-sidebar-primary"
        : "text-foreground/80 hover:bg-muted/60",
    );

  const hasSelection = Boolean(currentOwner && currentName);

  const triggerFallback = currentOwner ? (
    <OwnerAvatar owner={currentOwner} key={currentOwner} />
  ) : (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
      <IconBrandGithub size={16} className="text-muted-foreground" />
    </div>
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40",
            className,
          )}
        >
          <RepoLogo
            logoUrl={currentLogoUrl}
            size={36}
            fallback={triggerFallback}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            {hasSelection ? (
              <>
                <span className="truncate text-[11px] text-muted-foreground">
                  {currentOwner}
                </span>
                <span className="truncate text-sm font-semibold text-sidebar-foreground">
                  {displayLabel}
                </span>
              </>
            ) : (
              <span className="truncate text-sm font-semibold text-sidebar-foreground">
                Select a repo
              </span>
            )}
          </div>
          <IconSelector size={16} className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "p-0 transition-[width] duration-200",
          showAppsColumn
            ? "w-[min(580px,calc(100vw-2rem))]"
            : "w-[min(400px,calc(100vw-2rem))]",
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

        <div className="flex px-3 pb-3">
          <div className="w-[110px] shrink-0 bg-muted/30 sm:w-[130px]">
            <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Owner
            </p>
            <div className="scrollbar max-h-64 overflow-y-auto py-1 pl-1">
              {filteredOwners.map((ownerKey) => (
                <div
                  key={ownerKey}
                  onMouseEnter={() => {
                    setSelectedOwner(ownerKey);
                    const ownerRepos = filteredReposByOwner.get(ownerKey) ?? [];
                    const firstMonorepo = ownerRepos.find(
                      (r) => r.apps.length > 0,
                    );
                    setSelectedMonorepo(
                      firstMonorepo ? firstMonorepo.name : null,
                    );
                  }}
                  className={itemClass(ownerKey === effectiveOwner)}
                >
                  <IconUser
                    size={14}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="truncate">{ownerKey}</span>
                </div>
              ))}
              {filteredOwners.length === 0 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  No matches
                </p>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Codebase
            </p>
            <div className="scrollbar max-h-64 overflow-y-auto py-1 pl-1">
              {visibleRepos.map((repo) => {
                const isSelected =
                  repo.owner === currentOwner && repo.name === currentName;
                const isMonorepo = repo.apps.length > 0;
                const isMonorepoExpanded = selectedMonorepo === repo.name;

                return (
                  <div
                    key={`${repo.owner}/${repo.name}`}
                    onClick={() => handleRepoClick(repo)}
                    onMouseEnter={() => {
                      if (isMonorepo) {
                        setSelectedMonorepo(repo.name);
                      } else {
                        setSelectedMonorepo(null);
                      }
                    }}
                    className={cn(
                      itemClass(isSelected || isMonorepoExpanded),
                      "justify-between",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <RepoLogo
                        logoUrl={isMonorepo ? null : repo.root?.logoUrl}
                        size={14}
                        fallback={
                          <IconBrandGithub
                            size={14}
                            className="shrink-0 text-muted-foreground"
                          />
                        }
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
          </div>

          {showAppsColumn && (
            <div className="w-[110px] shrink-0 bg-muted/30 sm:w-[140px]">
              <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                App
              </p>
              <div className="scrollbar max-h-64 overflow-y-auto py-1 pr-1">
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
                      <RepoLogo
                        logoUrl={app.logoUrl}
                        size={14}
                        fallback={
                          <IconFolder
                            size={14}
                            className="shrink-0 text-muted-foreground"
                          />
                        }
                      />
                      <span className="truncate">{appLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
