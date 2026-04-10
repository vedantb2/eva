"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Card,
  CardContent,
  Button,
  Input,
  Spinner,
  Badge,
} from "@conductor/ui";
import {
  IconFolders,
  IconPlus,
  IconCheck,
  IconTerminal2,
  IconAlertCircle,
  IconRefresh,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";

type DetectedApp = FunctionReturnType<
  typeof api.github.detectMonorepoApps
>[number];

export function MonorepoClient() {
  const { repo } = useRepo();
  const detectApps = useAction(api.github.detectMonorepoApps);
  const createRepo = useMutation(api.githubRepos.create);
  const toggleHidden = useMutation(api.githubRepos.toggleHidden);
  const allRepos = useQuery(api.githubRepos.list, { includeHidden: true });

  const [detected, setDetected] = useState<ReadonlyArray<DetectedApp>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingPath, setAddingPath] = useState<string | null>(null);
  const [customPath, setCustomPath] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAddCustom = async () => {
    const trimmed = customPath.trim().replace(/^\/+|\/+$/g, "");
    if (!trimmed) return;
    await handleAdd(trimmed);
    setCustomPath("");
  };

  return (
    <PageWrapper
      title="Monorepo Apps"
      comfortable
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
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Connected Apps
          </h3>
          <p className="text-xs text-muted-foreground">
            Toggle visibility to hide apps from the sidebar and home page
            without removing them.
          </p>
          <div className="space-y-2">
            {connectedApps.map((app) => (
              <Card key={app._id} className="ui-surface-strong">
                <CardContent className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3">
                  <IconFolders size={18} className="text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {app.rootDirectory?.split("/").pop()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.rootDirectory}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={app.hidden ? "outline" : "ghost"}
                    onClick={() =>
                      toggleHidden({
                        repoId: app._id,
                        hidden: app.hidden !== true,
                      })
                    }
                    className={
                      app.hidden
                        ? "motion-press gap-1.5 border-border text-muted-foreground"
                        : "motion-press gap-1.5 text-muted-foreground hover:text-foreground"
                    }
                  >
                    {app.hidden ? (
                      <>
                        <IconEyeOff size={14} />
                        Hidden
                      </>
                    ) : (
                      <>
                        <IconEye size={14} />
                        Visible
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Detect Apps</h3>
        <p className="text-xs text-muted-foreground">
          Scan{" "}
          <span className="font-medium text-foreground">
            {repo.owner}/{repo.name}
          </span>{" "}
          for workspace apps and add them as separate codebases.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-muted-foreground">
              Scanning workspace configuration...
            </p>
          </div>
        </div>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-3 p-4">
            <IconAlertCircle size={20} className="text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Detection failed
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : detected.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <IconFolders size={28} className="text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              No workspace apps detected
            </p>
            <p className="text-xs text-muted-foreground">
              This repository doesn't appear to have a monorepo workspace
              configuration (package.json workspaces or pnpm-workspace.yaml).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {detected.map((app) => {
            const isConnected = connectedPaths.has(app.path);
            const isAdding = addingPath === app.path;

            return (
              <Card key={app.path} className="ui-surface-strong">
                <CardContent className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3">
                  <IconFolders size={18} className="text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {app.name}
                      </p>
                      {app.hasDevScript && (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-[10px]"
                        >
                          <IconTerminal2 size={10} />
                          dev
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{app.path}</p>
                  </div>
                  {isConnected ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/30 text-primary"
                    >
                      <IconCheck size={12} />
                      Added
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAdding}
                      onClick={() => void handleAdd(app.path)}
                      className="motion-press"
                    >
                      {isAdding ? (
                        <Spinner size="sm" />
                      ) : (
                        <IconPlus size={14} />
                      )}
                      Add
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-2">
        <CardContent className="p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Custom root directory
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleAddCustom();
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="e.g. apps/api"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={
                !customPath.trim() ||
                addingPath === customPath.trim().replace(/^\/+|\/+$/g, "")
              }
              className="motion-press"
            >
              <IconPlus size={14} />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
