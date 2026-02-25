"use client";

import { useState, useEffect, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";

interface Branch {
  name: string;
  protected: boolean;
}

export function useBranches(
  owner: string,
  repoName: string,
  installationId: number,
  enabled: boolean = true,
) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isValidating, setIsValidating] = useState(false);
  const fetchBranches = useAction(api.github.listBranches);

  const load = useCallback(async () => {
    try {
      const result = await fetchBranches({
        installationId,
        owner,
        repo: repoName,
      });
      setBranches(result);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  }, [fetchBranches, installationId, owner, repoName]);

  useEffect(() => {
    if (!enabled) return;
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load, enabled]);

  const refresh = useCallback(async () => {
    setIsValidating(true);
    await load();
    setIsValidating(false);
  }, [load]);

  return { branches, isLoading, isValidating, refresh };
}
