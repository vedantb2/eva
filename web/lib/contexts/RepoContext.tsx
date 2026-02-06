"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { decodeRepoSlug } from "@/lib/utils/repoUrl";
import type { FunctionReturnType } from "convex/server";

type Repo = NonNullable<FunctionReturnType<typeof api.githubRepos.getByOwnerAndName>>;

interface RepoContextType {
  repo: Repo;
  repoId: Repo["_id"];
  repoSlug: string;
  fullName: string;
  installationId: number;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

interface RepoProviderProps {
  children: React.ReactNode;
  repoSlug: string;
}

export function RepoProvider({ children, repoSlug }: RepoProviderProps) {
  const fullName = decodeRepoSlug(repoSlug);
  const [owner, name] = fullName.split("/");

  const repo = useQuery(api.githubRepos.getByOwnerAndName, { owner, name });

  const value = useMemo(() => {
    if (!repo) return undefined;
    return {
      repo,
      repoId: repo._id,
      repoSlug,
      fullName,
      installationId: repo.installationId,
    };
  }, [repo, repoSlug, fullName]);

  if (repo === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (repo === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Repository not found
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          The repository &quot;{fullName}&quot; does not exist or you don&apos;t
          have access to it.
        </p>
      </div>
    );
  }

  return (
    <RepoContext.Provider value={value}>{children}</RepoContext.Provider>
  );
}

export function useRepo() {
  const context = useContext(RepoContext);
  if (context === undefined) {
    throw new Error("useRepo must be used within a RepoProvider");
  }
  return context;
}

export const useRepoContext = useRepo;
