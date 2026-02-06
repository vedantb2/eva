"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";
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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const storageKey = getStorageKey(owner, repoName);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setSelectedBranch(stored);
    }
  }, [storageKey]);

  const fetchBranches = useCallback(
    async (isSync = false) => {
      if (isSync) {
        setSyncing(true);
      } else {
        setLoading(true);
      }
      try {
        const params = new URLSearchParams({
          owner,
          repo: repoName,
          installationId: String(installationId),
        });
        const res = await fetch(`/api/github/branches?${params}`);
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches);
          const stored = localStorage.getItem(storageKey);
          if (!stored && data.branches.length > 0) {
            const defaultBranch =
              data.branches.find((b: Branch) => b.name === "main") ||
              data.branches.find((b: Branch) => b.name === "master") ||
              data.branches[0];
            setSelectedBranch(defaultBranch.name);
            localStorage.setItem(storageKey, defaultBranch.name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      } finally {
        if (isSync) {
          setSyncing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [owner, repoName, installationId, storageKey],
  );

  useEffect(() => {
    fetchBranches(false);
  }, [fetchBranches]);

  const handleSync = useCallback(() => {
    fetchBranches(true);
  }, [fetchBranches]);

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 w-full p-2 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800/50">
        <IconLoader2 className="w-4 h-4 text-neutral-400 animate-spin" />
        <span className="text-sm text-neutral-400">Loading branches...</span>
      </div>
    );
  }

  if (branches.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            className="flex items-center gap-2 flex-1 px-2 py-2 transition-colors"
          >
            <IconGitBranch className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span className="flex-1 text-left text-sm text-neutral-700 dark:text-neutral-300 truncate">
              {selectedBranch}
            </span>
            <IconSelector className="w-4 h-4 text-neutral-400" />
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
                className="px-3 py-2 text-sm text-neutral-900 dark:text-white"
              >
                <IconGitBranch className="mr-2 h-4 w-4 text-neutral-500" />
                {branch.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleSync}
        disabled={syncing}
        title="Sync branches from GitHub"
        className="h-8 w-8"
      >
        <IconRefresh
          className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 ${syncing ? "animate-spin" : ""}`}
        />
      </Button>
    </div>
  );
}
