import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAction, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { Container } from "@/lib/components/ui/Container";
import { Button, Spinner } from "@conductor/ui";
import { RepoSetupCard } from "./_components/RepoSetupCard";
import { MonorepoAppsPanel } from "./_components/MonorepoAppsPanel";
import type { GitHubRepo } from "./_components/RepoSetupCard";
import type { MonorepoApp } from "./_components/MonorepoAppsPanel";

interface RepoSetupClientProps {
  installationId: string;
  autoSync: boolean;
}

export function RepoSetupClient({
  installationId,
  autoSync,
}: RepoSetupClientProps) {
  const navigate = useNavigate();

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
            githubId: repo.id,
          });
          setAddedRepos((prev) => new Set([...prev, repo.fullName]));
        } catch {}
      }
    }

    setSyncing(false);
    navigate({ to: "/home" });
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
        githubId: repo.id,
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
          <Button variant="secondary" onClick={() => navigate({ to: "/home" })}>
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
          {repos.map((repo) => (
            <RepoSetupCard
              key={repo.id}
              repo={repo}
              isExpanded={expandedRepo === repo.fullName}
              isAdded={addedRepos.has(repo.fullName)}
              onToggleExpand={() => handleDetectMonorepo(repo)}
              onAdd={() => addRepoEntry(repo)}
            >
              <MonorepoAppsPanel
                apps={monorepoApps[repo.fullName] ?? []}
                isDetecting={detectingMonorepo === repo.fullName}
                addedRepos={addedRepos}
                repoFullName={repo.fullName}
                onAddApp={(path) => addRepoEntry(repo, path)}
              />
            </RepoSetupCard>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            className="flex-1"
            onClick={handleAddAll}
            disabled={repos.length === addedRepos.size}
          >
            Add All & Continue
          </Button>
          <Button variant="secondary" onClick={() => navigate({ to: "/home" })}>
            Done
          </Button>
        </div>
      </div>
    </Container>
  );
}
