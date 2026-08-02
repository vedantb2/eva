"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueries } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@eva/ui";
import { GlobalSessionGroup } from "@/lib/components/sidebar/_components/GlobalSessionGroup";
import { repoMatchesPath } from "@/lib/components/sidebar/_utils/repoSessionPaths";
import {
  sessionActivityAt,
  sortAppsForSidebar,
} from "@/lib/components/sidebar/_utils/sessionsSidebarSettings";
import { useSessionsSidebarSettings } from "@/lib/components/sidebar/useSessionsSidebarSettings";
import { entityPathSegment } from "@/lib/numId";

type SessionListItem = FunctionReturnType<typeof api.sessions.list>[number];
type RepoRow = FunctionReturnType<typeof api.githubRepos.list>[number];

interface GlobalSessionsSidebarProps {
  pathname: string;
  onNavigate?: () => void;
}

/**
 * Cross-repo Sessions list for the rail entry point: every accessible app as a
 * collapsible group (empty apps included), archived nested under each app
 * (default collapsed).
 */
export function GlobalSessionsSidebar({
  pathname,
  onNavigate,
}: GlobalSessionsSidebarProps) {
  const navigate = useNavigate();
  const { settings } = useSessionsSidebarSettings();
  const repos = useQuery(api.githubRepos.list, {});
  const [openByRepoId, setOpenByRepoId] = useState<Record<string, boolean>>({});
  const [sessionToRename, setSessionToRename] = useState<{
    session: SessionListItem;
    repo: RepoRow;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [sessionToArchive, setSessionToArchive] = useState<{
    session: SessionListItem;
    repo: RepoRow;
    pathSegment: string;
  } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const archiveSession = useMutation(api.sessions.archive);
  const stopSandboxMutation = useMutation(api.sessions.stopSandbox);
  const updateSession = useMutation(api.sessions.update);

  // Stable identity required by useQueries; deduped with each group's list watch.
  const sessionListQueries = useMemo(() => {
    if (repos === undefined) return {};
    return Object.fromEntries(
      repos.map((repo) => [
        repo._id,
        {
          query: api.sessions.list,
          args: { repoId: repo._id },
        },
      ]),
    );
  }, [repos]);
  const sessionsByRepoId = useQueries(sessionListQueries);

  const latestActivityByAppId = new Map<string, number>();
  for (const [repoId, result] of Object.entries(sessionsByRepoId)) {
    if (result === undefined || result instanceof Error) continue;
    let latest = 0;
    for (const session of result) {
      const at = sessionActivityAt(session);
      if (at > latest) latest = at;
    }
    if (latest > 0) latestActivityByAppId.set(repoId, latest);
  }

  const orderedRepos =
    repos === undefined
      ? undefined
      : sortAppsForSidebar(repos, settings.appSortOrder, latestActivityByAppId);

  const isGroupOpen = (repo: RepoRow): boolean => {
    const stored = openByRepoId[repo._id];
    if (stored !== undefined) return stored;
    // Default: collapsed unless this app owns the active session URL.
    return repoMatchesPath(repo, pathname) && pathname.includes("/sessions");
  };

  return (
    <>
      <div className="flex-1 space-y-3 px-0 pb-1">
        {orderedRepos === undefined ? (
          <div
            className="min-h-[12rem] space-y-2 px-3"
            aria-busy="true"
            aria-label="Loading sessions"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-9 animate-pulse rounded-md bg-muted/60"
              />
            ))}
          </div>
        ) : orderedRepos.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No apps yet
          </p>
        ) : (
          orderedRepos.map((repo) => (
            <GlobalSessionGroup
              key={repo._id}
              repo={repo}
              pathname={pathname}
              open={isGroupOpen(repo)}
              onOpenChange={(open) => {
                setOpenByRepoId((prev) => ({ ...prev, [repo._id]: open }));
              }}
              onNavigate={onNavigate}
              sessionSortOrder={settings.sessionSortOrder}
              sessionPreviewCount={settings.sessionPreviewCount}
              onRenameRequest={(session, groupRepo) => {
                setSessionToRename({ session, repo: groupRepo });
                setRenameValue(session.title);
              }}
              onArchiveRequest={(session, groupRepo) => {
                const pathSegment = entityPathSegment(session);
                if (!pathSegment) return;
                setSessionToArchive({
                  session,
                  repo: groupRepo,
                  pathSegment,
                });
              }}
            />
          ))
        )}
      </div>

      <Dialog
        open={sessionToRename !== null}
        onOpenChange={(open) => {
          if (!open) setSessionToRename(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename session</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameValue.trim() && sessionToRename) {
                e.preventDefault();
                void (async () => {
                  setIsRenaming(true);
                  // Reset duplicated into the catch instead of `finally`:
                  // React Compiler bails on the whole file for a `finally`.
                  try {
                    await updateSession({
                      id: sessionToRename.session._id,
                      title: renameValue.trim(),
                    });
                    setSessionToRename(null);
                  } catch (error) {
                    setIsRenaming(false);
                    throw error;
                  }
                  setIsRenaming(false);
                })();
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSessionToRename(null)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              disabled={!renameValue.trim() || isRenaming}
              onClick={() => {
                if (!sessionToRename || !renameValue.trim()) return;
                void (async () => {
                  setIsRenaming(true);
                  // Reset duplicated into the catch instead of `finally`:
                  // React Compiler bails on the whole file for a `finally`.
                  try {
                    await updateSession({
                      id: sessionToRename.session._id,
                      title: renameValue.trim(),
                    });
                    setSessionToRename(null);
                  } catch (error) {
                    setIsRenaming(false);
                    throw error;
                  }
                  setIsRenaming(false);
                })();
              }}
            >
              {isRenaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sessionToArchive !== null}
        onOpenChange={(open) => {
          if (!open) setSessionToArchive(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Session</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will stop the sandbox and remove{" "}
            <span className="font-medium text-foreground">
              {sessionToArchive?.session.title}
            </span>{" "}
            from the active list.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSessionToArchive(null)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isArchiving}
              onClick={() => {
                if (!sessionToArchive) return;
                void (async () => {
                  setIsArchiving(true);
                  try {
                    if (sessionToArchive.session.sandboxId) {
                      await stopSandboxMutation({
                        sessionId: sessionToArchive.session._id,
                      });
                    }
                    await archiveSession({
                      id: sessionToArchive.session._id,
                    });
                    if (
                      pathname.includes(
                        `/sessions/${sessionToArchive.pathSegment}`,
                      )
                    ) {
                      navigate({ to: "/sessions" });
                    }
                    setSessionToArchive(null);
                    // `if` rather than `?.`, and the reset duplicated into the
                    // catch rather than a `finally`: React Compiler bails on
                    // the whole file for either.
                    if (onNavigate) onNavigate();
                  } catch (error) {
                    setIsArchiving(false);
                    throw error;
                  }
                  setIsArchiving(false);
                })();
              }}
            >
              {isArchiving ? "Archiving…" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
