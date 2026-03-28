"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { decodeRepoParam } from "@/lib/utils/repoUrl";
import type { FunctionReturnType } from "convex/server";
import { Spinner } from "@conductor/ui";

type Repo = NonNullable<
  FunctionReturnType<typeof api.githubRepos.getByOwnerAndName>
>;

interface RepoContextType {
  repo: Repo;
  repoId: Repo["_id"];
  basePath: string;
  owner: string;
  name: string;
  installationId: number;
  rootDirectory: string | undefined;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

interface RepoProviderProps {
  children: React.ReactNode;
  owner: string;
  repoParam: string;
}

export function RepoProvider({
  children,
  owner,
  repoParam,
}: RepoProviderProps) {
  const { name, appName } = decodeRepoParam(repoParam);

  const repo = useQuery(api.githubRepos.getByOwnerAndName, {
    owner,
    name,
    appName,
  });

  const basePath = appName
    ? `/${owner}/${name}--${appName}`
    : `/${owner}/${name}`;

  const value = useMemo(() => {
    if (!repo) return undefined;
    return {
      repo,
      repoId: repo._id,
      basePath,
      owner,
      name,
      installationId: repo.installationId,
      rootDirectory: repo.rootDirectory,
    };
  }, [repo, basePath, owner, name]);

  if (repo === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (repo === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Repository not found
        </h1>
        <p className="text-muted-foreground">
          The repository &quot;{owner}/{name}&quot; does not exist or you
          don&apos;t have access to it.
        </p>
      </div>
    );
  }

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepo() {
  const context = useContext(RepoContext);
  if (context === undefined) {
    throw new Error("useRepo must be used within a RepoProvider");
  }
  return context;
}

export const useRepoContext = useRepo;
