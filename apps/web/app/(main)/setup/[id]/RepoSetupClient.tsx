"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { Container } from "@/lib/components/ui/Container";
import { Button, Spinner } from "@conductor/ui";
import {
  IconBrandGithub,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
} from "@tabler/icons-react";

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  url: string;
}

interface MonorepoApp {
  name: string;
  path: string;
  hasDevScript: boolean;
}

interface RepoSetupClientProps {
  installationId: string;
}

export function RepoSetupClient({ installationId }: RepoSetupClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoSync = searchParams.get("auto") !== "false";

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedRepos, setAddedRepos] = useState<Set<string>>(new Set());
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [monorepoApps, setMonorepoApps] = useState<
    Record<string, MonorepoApp[]>
  >({});
  const [detectingMonorepo, setDetectingMonorepo] = useState<string | null>(
    null,
  );
  const [customRootDir, setCustomRootDir] = useState("");
  const syncedRef = useRef(false);

  const createRepo = useMutation(api.githubRepos.create);
  const fetchRepos = useAction(api.github.listRepos);
  const detectMonorepo = useAction(api.github.detectMonorepoApps);

  useEffect(() => {
    fetchRepos({ installationId: Number(installationId) })
      .then((data) => {
        setRepos(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch repos");
        setLoading(false);
      });
  }, [installationId, fetchRepos]);

  useEffect(() => {
    if (!loading && repos.length > 0 && autoSync && !syncedRef.current) {
      syncedRef.current = true;
      handleAddAll();
    }
  }, [loading, repos, autoSync]);

  const handleAddAll = async () => {
    if (syncing) return;
    setSyncing(true);

    for (const repo of repos) {
      if (!addedRepos.has(repo.fullName)) {
        try {
          await createRepo({
            owner: repo.owner,
            name: repo.name,
            installationId: Number(installationId),
          });
          setAddedRepos((prev) => new Set([...prev, repo.fullName]));
        } catch {}
      }
    }

    setSyncing(false);
    router.push("/home");
  };

  const handleDetectMonorepo = async (repo: GitHubRepo) => {
    if (expandedRepo === repo.fullName) {
      setExpandedRepo(null);
      return;
    }

    setExpandedRepo(repo.fullName);

    if (monorepoApps[repo.fullName]) return;

    setDetectingMonorepo(repo.fullName);
    try {
      const apps = await detectMonorepo({
        installationId: Number(installationId),
        owner: repo.owner,
        name: repo.name,
      });
      setMonorepoApps((prev) => ({ ...prev, [repo.fullName]: apps }));
    } catch {
      setMonorepoApps((prev) => ({ ...prev, [repo.fullName]: [] }));
    }
    setDetectingMonorepo(null);
  };

  const addRepoEntry = async (repo: GitHubRepo, rootDirectory?: string) => {
    const key = rootDirectory
      ? `${repo.fullName}:${rootDirectory}`
      : repo.fullName;
    if (addedRepos.has(key)) return;
    try {
      await createRepo({
        owner: repo.owner,
        name: repo.name,
        installationId: Number(installationId),
        rootDirectory,
      });
      setAddedRepos((prev) => new Set([...prev, key]));
    } catch {}
  };

  if (loading || syncing) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" className="mb-4" />
          <p className="text-muted-foreground">
            {syncing ? "Adding repositories..." : "Loading repositories..."}
          </p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.push("/home")}>
            Back to Repositories
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-4 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          GitHub App Installed
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
          Select which repositories you want to add to Eva.
        </p>

        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {repos.map((repo) => {
            const isExpanded = expandedRepo === repo.fullName;
            const apps = monorepoApps[repo.fullName];
            const isDetecting = detectingMonorepo === repo.fullName;

            return (
              <div
                key={repo.id}
                className="rounded-xl border border-border overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 sm:p-4 bg-card">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <IconBrandGithub className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base text-foreground truncate">
                        {repo.name}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {repo.owner}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {addedRepos.has(repo.fullName) ? (
                      <span className="flex items-center gap-1 text-success text-xs sm:text-sm">
                        <IconCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">Added</span>
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => addRepoEntry(repo)}>
                        Add
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDetectMonorepo(repo)}
                    >
                      {isExpanded ? (
                        <IconChevronDown className="w-4 h-4" />
                      ) : (
                        <IconChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-3 sm:p-4 space-y-2">
                    {isDetecting ? (
                      <div className="flex items-center gap-2 py-2">
                        <Spinner size="sm" />
                        <span className="text-xs text-muted-foreground">
                          Detecting workspace apps...
                        </span>
                      </div>
                    ) : apps && apps.length > 0 ? (
                      <>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Monorepo apps detected:
                        </p>
                        {apps.map((app) => {
                          const key = `${repo.fullName}:${app.path}`;
                          return (
                            <div
                              key={app.path}
                              className="flex items-center justify-between p-2 rounded-lg bg-card border border-border"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <IconFolder className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {app.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {app.path}
                                    {app.hasDevScript && " · has dev script"}
                                  </p>
                                </div>
                              </div>
                              {addedRepos.has(key) ? (
                                <span className="flex items-center gap-1 text-success text-xs flex-shrink-0">
                                  <IconCheck className="w-3 h-3" />
                                  Added
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="flex-shrink-0"
                                  onClick={() => addRepoEntry(repo, app.path)}
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          );
                        })}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Custom root directory..."
                            value={customRootDir}
                            onChange={(e) => setCustomRootDir(e.target.value)}
                            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!customRootDir.trim()}
                            onClick={() => {
                              addRepoEntry(repo, customRootDir.trim());
                              setCustomRootDir("");
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground py-1">
                        No workspace apps detected. This repo can be added as a
                        single project.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            className="flex-1"
            onClick={handleAddAll}
            disabled={repos.length === addedRepos.size}
          >
            Add All & Continue
          </Button>
          <Button variant="secondary" onClick={() => router.push("/home")}>
            Done
          </Button>
        </div>
      </div>
    </Container>
  );
}
