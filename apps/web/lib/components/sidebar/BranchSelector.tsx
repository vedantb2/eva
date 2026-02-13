"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import useSWR from "swr";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Button,
} from "@conductor/ui";
import {
  IconGitBranch,
  IconSelector,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";

interface Branch {
  name: string;
  protected: boolean;
}

interface BranchSelectorProps {
  owner: string;
  repoName: string;
  installationId: number;
}

function getStorageKey(owner: string, repoName: string) {
  return `conductor:baseBranch:${owner}/${repoName}`;
}

async function fetchBranches(url: string): Promise<Branch[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch branches");
  }
  const data = (await res.json()) as { branches?: Branch[] };
  return data.branches ?? [];
}

export function useBaseBranch(owner: string, repoName: string): string {
  const storageKey = getStorageKey(owner, repoName);

  const subscribe = useCallback(
    (callback: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === storageKey) callback();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    [storageKey],
  );

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(storageKey) ?? "main";
  }, [storageKey]);

  const getServerSnapshot = useCallback(() => "main", []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function BranchSelector({
  owner,
  repoName,
  installationId,
}: BranchSelectorProps) {
  const [syncing, setSyncing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const storageKey = getStorageKey(owner, repoName);
  const params = new URLSearchParams({
    owner,
    repo: repoName,
    installationId: String(installationId),
  });
  const branchesUrl = `/api/github/branches?${params}`;
  const {
    data: branches = [],
    isLoading,
    isValidating,
    mutate,
  } = useSWR<Branch[]>(branchesUrl, fetchBranches, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setSelectedBranch(stored);
  }, [storageKey]);

  useEffect(() => {
    if (branches.length === 0) {
      return;
    }
    const stored = localStorage.getItem(storageKey);
    if (stored && branches.some((branch) => branch.name === stored)) {
      if (selectedBranch !== stored) {
        setSelectedBranch(stored);
      }
      return;
    }

    const defaultBranch =
      branches.find((branch) => branch.name === "main") ||
      branches.find((branch) => branch.name === "master") ||
      branches[0];

    if (!defaultBranch) {
      return;
    }

    if (selectedBranch !== defaultBranch.name) {
      setSelectedBranch(defaultBranch.name);
    }
    localStorage.setItem(storageKey, defaultBranch.name);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: storageKey,
        newValue: defaultBranch.name,
      }),
    );
  }, [branches, selectedBranch, storageKey]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await mutate();
    } catch (error) {
      console.error("Failed to sync branches:", error);
    } finally {
      setSyncing(false);
    }
  }, [mutate]);

  const handleBranchChange = useCallback(
    (branch: string) => {
      setSelectedBranch(branch);
      localStorage.setItem(storageKey, branch);
      window.dispatchEvent(
        new StorageEvent("storage", { key: storageKey, newValue: branch }),
      );
    },
    [storageKey],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex h-8 flex-1 items-center gap-2 rounded-md border border-sidebar-border/70 bg-sidebar/70 px-2">
          <IconLoader2
            size={16}
            className="animate-spin text-muted-foreground"
          />
          <span className="text-sm text-muted-foreground">
            Loading branches
          </span>
        </div>
        <Button size="icon" variant="ghost" disabled className="h-8 w-8">
          <IconRefresh size={16} className="text-muted-foreground/60" />
        </Button>
      </div>
    );
  }

  if (branches.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="flex flex-1 items-center gap-2 border-sidebar-border/70 bg-sidebar/70 px-2 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <IconGitBranch size={16} className="text-muted-foreground" />
            <span className="flex-1 truncate text-left text-sm text-sidebar-foreground">
              {selectedBranch ?? branches[0]?.name}
            </span>
            <IconSelector size={16} className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-64 overflow-auto scrollbar">
          <DropdownMenuRadioGroup
            value={selectedBranch ?? ""}
            onValueChange={handleBranchChange}
          >
            {branches.map((branch) => (
              <DropdownMenuRadioItem
                key={branch.name}
                value={branch.name}
                className="text-sm"
              >
                <IconGitBranch size={16} className="text-muted-foreground" />
                {branch.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSync}
        disabled={syncing || isValidating}
        title="Sync branches from GitHub"
        className="h-8 w-8"
      >
        <IconRefresh
          size={16}
          className={`text-muted-foreground ${syncing ? "animate-spin" : ""}`}
        />
      </Button>
    </div>
  );
}
