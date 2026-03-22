"use client";

import { useState, useEffect, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";

interface Branch {
  name: string;
  protected: boolean;
}

interface CacheEntry {
  branches: Branch[];
  timestamp: number;
}

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const branchCache = new Map<string, CacheEntry>();

function getCacheKey(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

function getCached(key: string): Branch[] | null {
  const entry = branchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
    branchCache.delete(key);
    return null;
  }
  return entry.branches;
}

export function useBranches(
  owner: string,
  repoName: string,
  installationId: number,
  enabled: boolean = true,
) {
  const cacheKey = getCacheKey(owner, repoName);
  const cached = getCached(cacheKey);

  const [branches, setBranches] = useState<Branch[]>(cached ?? []);
  const [isLoading, setIsLoading] = useState(enabled && !cached);
  const [isValidating, setIsValidating] = useState(false);
  const fetchBranches = useAction(api.github.listBranches);

  const load = useCallback(async () => {
    try {
      const result = await fetchBranches({
        installationId,
        owner,
        repo: repoName,
      });
      branchCache.set(cacheKey, { branches: result, timestamp: Date.now() });
      setBranches(result);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  }, [fetchBranches, installationId, owner, repoName, cacheKey]);

  useEffect(() => {
    if (!enabled) return;

    const cachedBranches = getCached(cacheKey);
    if (cachedBranches) {
      setBranches(cachedBranches);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load, enabled, cacheKey]);

  const refresh = useCallback(async () => {
    setIsValidating(true);
    branchCache.delete(cacheKey);
    await load();
    setIsValidating(false);
  }, [load, cacheKey]);

  return { branches, isLoading, isValidating, refresh };
}
