"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction, useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SettingsPage } from "@/lib/components/settings/SettingsPage";
import { Button } from "@eva/ui";
import { IconRefresh } from "@tabler/icons-react";
import { ConnectedAppsSection } from "./monorepo/_components/ConnectedAppsSection";
import { DetectedAppsSection } from "./monorepo/_components/DetectedAppsSection";
import { CustomRootDirectoryForm } from "./monorepo/_components/CustomRootDirectoryForm";

export type ConnectedApp = FunctionReturnType<
  typeof api.githubRepos.list
>[number];
export type DetectedApp = FunctionReturnType<
  typeof api.github.detectMonorepoApps
>[number];

export function MonorepoClient() {
  const { repo } = useRepo();
  const detectApps = useAction(api.github.detectMonorepoApps);
  const createRepo = useMutation(api.githubRepos.create);
  const toggleHidden = useMutation(
    api.githubRepos.toggleHidden,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.githubRepos.list, {
      includeHidden: true,
    });
    if (current !== undefined) {
      localStore.setQuery(
        api.githubRepos.list,
        { includeHidden: true },
        current.map((r) =>
          r._id === args.repoId ? { ...r, hidden: args.hidden } : r,
        ),
      );
    }
  });
  const allRepos = useQuery(api.githubRepos.list, { includeHidden: true });

  const [detected, setDetected] = useState<ReadonlyArray<DetectedApp>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingPath, setAddingPath] = useState<string | null>(null);

  const connectedApps = (allRepos ?? []).filter(
    (r) => r.owner === repo.owner && r.name === repo.name && r.rootDirectory,
  );

  const connectedPaths = new Set(connectedApps.map((r) => r.rootDirectory));

  const runDetection = async () => {
    setLoading(true);
    setError(null);
    try {
      const apps = await detectApps({
        installationId: repo.installationId,
        owner: repo.owner,
        name: repo.name,
      });
      setDetected(apps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    }
    setLoading(false);
  };

  useEffect(() => {
    void runDetection();
    // eslint-disable-next-line react/exhaustive-deps
  }, [repo.owner, repo.name, repo.installationId]);

  const handleAdd = async (path: string) => {
    setAddingPath(path);
    try {
      await createRepo({
        owner: repo.owner,
        name: repo.name,
        installationId: repo.installationId,
        githubId: repo.githubId,
        rootDirectory: path,
        teamId: repo.teamId,
      });
    } catch (err) {
      console.error("Failed to add app:", err);
    }
    setAddingPath(null);
  };

  return (
    <SettingsPage
      title="Monorepo Apps"
      headerRight={
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => void runDetection()}
          className="motion-press border-border text-muted-foreground"
        >
          <IconRefresh size={16} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Re-detect</span>
        </Button>
      }
    >
      {connectedApps.length > 0 && (
        <ConnectedAppsSection
          apps={connectedApps}
          onToggleHidden={(repoId, hidden) => toggleHidden({ repoId, hidden })}
        />
      )}

      <DetectedAppsSection
        owner={repo.owner}
        name={repo.name}
        loading={loading}
        error={error}
        detected={detected}
        connectedPaths={connectedPaths}
        addingPath={addingPath}
        onAdd={(path) => void handleAdd(path)}
      />

      <CustomRootDirectoryForm
        addingPath={addingPath}
        onAdd={(path) => void handleAdd(path)}
      />
    </SettingsPage>
  );
}
