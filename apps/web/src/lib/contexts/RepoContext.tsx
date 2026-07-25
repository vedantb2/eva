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

// Internal load-state context: "pending" while the repo query hasn't resolved
// yet, otherwise the resolved (possibly undefined-repo) context value. This
// lets RepoProvider always render its children (so sidebar/chrome mounted
// above it never unmounts on navigation) while RepoGate scopes the loading
// spinner to just the routed content that actually needs `repo`.
const RepoLoadStateContext = createContext<
  RepoContextType | undefined | "pending"
>("pending");

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

  const loadState = repo === undefined ? "pending" : value;

  return (
    <RepoLoadStateContext.Provider value={loadState}>
      {children}
    </RepoLoadStateContext.Provider>
  );
}

/**
 * Scopes the repo-loading spinner to routed content. Renders a content-area
 * spinner until the repo query resolves, then provides RepoContext to
 * `children`. Chrome mounted above RepoProvider (sidebar, etc.) is unaffected.
 */
export function RepoGate({ children }: { children: React.ReactNode }) {
  const loadState = useContext(RepoLoadStateContext);

  // Treat both "query still loading" and "repo not found" (redirect in
  // flight) as pending — children rely on useRepo's non-nullable contract.
  if (loadState === "pending" || loadState === undefined) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RepoContext.Provider value={loadState}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </RepoContext.Provider>
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
