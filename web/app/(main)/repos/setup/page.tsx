"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/api";
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

export default function RepoSetupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const installationId = searchParams.get("installation_id");
  const autoSync = searchParams.get("auto") !== "false";
  
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedRepos, setAddedRepos] = useState<Set<string>>(new Set());
  const syncedRef = useRef(false);
  
  const createRepo = useMutation(api.githubRepos.create);

  useEffect(() => {
    if (!installationId) {
      setError("No installation ID provided");
      setLoading(false);
      return;
    }

    fetch("/api/github/repos?installation_id=" + installationId)
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
    if (!installationId || syncing) return;
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
        } catch {
        }
      }
    }
    
    setSyncing(false);
    router.push("/repos");
  };

  if (loading || syncing) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20">
          <IconLoader2 className="w-8 h-8 text-pink-600 animate-spin mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
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
            onClick={() => router.push("/repos")}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
          >
            Back to Repositories
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          GitHub App Installed
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Select which repositories you want to add to Conductor.
        </p>

        <div className="space-y-3 mb-6">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-center gap-3">
                <IconBrandGithub className="w-5 h-5 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {repo.name}
                  </p>
                  <p className="text-sm text-neutral-500">{repo.owner}</p>
                </div>
              </div>
              {addedRepos.has(repo.fullName) ? (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <IconCheck className="w-4 h-4" />
                  Added
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
                      setAddedRepos((prev) => new Set([...prev, repo.fullName]));
                    } catch {}
                  }}
                  className="px-3 py-1.5 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  Add
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAddAll}
            disabled={repos.length === addedRepos.size}
            className="flex-1 px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add All & Continue
          </button>
          <button
            onClick={() => router.push("/repos")}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            Done
          </button>
        </div>
      </div>
    </Container>
  );
}
