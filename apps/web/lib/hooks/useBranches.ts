"use client";

import useSWR from "swr";

interface Branch {
  name: string;
  protected: boolean;
}

async function fetchBranches(url: string): Promise<Branch[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch branches");
  }
  const data = (await res.json()) as { branches?: Branch[] };
  return data.branches ?? [];
}

export function useBranches(
  owner: string,
  repoName: string,
  installationId: number,
) {
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

  return { branches, isLoading, isValidating, refresh: mutate };
}
