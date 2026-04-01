"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useNavigate } from "@tanstack/react-router";
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

  const navigate = useNavigate();

  const repo = useQuery(api.githubRepos.getByOwnerAndName, {
    owner,
    name,
    appName,
  });

  useEffect(() => {
    if (repo === null) {
      navigate({ to: "/home", replace: true });
    }
  }, [repo, navigate]);

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
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
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
