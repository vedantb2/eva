"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { Container } from "@/lib/components/ui/Container";
import { IconBrandGithub, IconCheck, IconLoader2 } from "@tabler/icons-react";

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  url: string;
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
  const syncedRef = useRef(false);

  const createRepo = useMutation(api.githubRepos.create);

  useEffect(() => {
    fetch("/api/github/repos/" + installationId)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setRepos(data.repos || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [installationId]);

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
    router.push("/");
  };

  if (loading || syncing) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20">
          <IconLoader2 className="w-8 h-8 text-primary animate-spin mb-4" />
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
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-secondary rounded-lg"
          >
            Back to Repositories
          </button>
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
            <div
              key={repo.id}
              className="flex items-center justify-between p-3 sm:p-4 bg-card rounded-xl border border-border"
            >
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
              {addedRepos.has(repo.fullName) ? (
                <span className="flex items-center gap-1 text-success text-xs sm:text-sm flex-shrink-0">
                  <IconCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Added</span>
                </span>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await createRepo({
                        owner: repo.owner,
                        name: repo.name,
                        installationId: Number(installationId),
                      });
                      setAddedRepos(
                        (prev) => new Set([...prev, repo.fullName]),
                      );
                    } catch {}
                  }}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-primary text-white rounded-lg hover:brightness-110 flex-shrink-0"
                >
                  Add
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleAddAll}
            disabled={repos.length === addedRepos.size}
            className="flex-1 px-4 py-2 bg-primary text-white text-sm sm:text-base font-medium rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add All & Continue
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-secondary text-foreground text-sm sm:text-base font-medium rounded-lg hover:bg-muted"
          >
            Done
          </button>
        </div>
      </div>
    </Container>
  );
}
