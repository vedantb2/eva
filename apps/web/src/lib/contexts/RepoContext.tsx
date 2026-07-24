"use client";

import { createContext, useContext, useEffect } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { api } from "@eva/backend";
import { decodeRepoParam } from "@/lib/utils/repoUrl";
import type { FunctionReturnType } from "convex/server";
import { Spinner } from "@eva/ui";

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
  const location = useLocation();

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

  // Bare /owner/repo URLs for monorepos without a visible root row resolve to an
  // app repo — canonicalize the path so links and basePath stay consistent.
  useEffect(() => {
    if (!repo?.rootDirectory || appName) return;
    const appSegment = repo.rootDirectory.split("/").pop();
    if (!appSegment) return;

    const barePrefix = `/${owner}/${repoParam}`;
    const canonicalPrefix = `/${owner}/${name}--${appSegment}`;
    if (!location.pathname.startsWith(barePrefix)) return;
    if (barePrefix === canonicalPrefix) return;

    navigate({
      to: `${canonicalPrefix}${location.pathname.slice(barePrefix.length)}`,
      search: (prev) => prev,
      replace: true,
    });
  }, [repo, appName, owner, name, repoParam, location.pathname, navigate]);

  const resolvedAppName = appName ?? repo?.rootDirectory?.split("/").pop();
  const basePath = resolvedAppName
    ? `/${owner}/${name}--${resolvedAppName}`
    : `/${owner}/${name}`;

  const value =
    repo === undefined || repo === null
      ? undefined
      : {
          repo,
          repoId: repo._id,
          basePath,
          owner,
          name,
          installationId: repo.installationId,
          rootDirectory: repo.rootDirectory,
        };

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
