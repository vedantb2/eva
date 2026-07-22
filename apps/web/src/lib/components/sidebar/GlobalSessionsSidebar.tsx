"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SearchInput,
  Spinner,
} from "@conductor/ui";
import { GlobalSessionGroup } from "@/lib/components/sidebar/_components/GlobalSessionGroup";
import { repoMatchesPath } from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { entityPathSegment } from "@/lib/numId";

type SessionListItem = FunctionReturnType<typeof api.sessions.list>[number];
type RepoRow = FunctionReturnType<typeof api.githubRepos.list>[number];

interface GlobalSessionsSidebarProps {
  pathname: string;
  onNavigate?: () => void;
}

/**
 * Cross-repo Sessions list for the rail entry point: every accessible app as a
 * collapsible group (empty apps included), search across titles, no archived.
 */
export function GlobalSessionsSidebar({
  pathname,
  onNavigate,
}: GlobalSessionsSidebarProps) {
  const navigate = useNavigate();
  const repos = useQuery(api.githubRepos.list, {});
  const [searchQuery, setSearchQuery] = useState("");
  const [openByRepoId, setOpenByRepoId] = useState<Record<string, boolean>>(
    {},
  );
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

  const isGroupOpen = (repo: RepoRow): boolean => {
    // While searching, expand every group so title matches aren't hidden.
    if (searchQuery.trim().length > 0) return true;
    const stored = openByRepoId[repo._id];
    if (stored !== undefined) return stored;
    // Default: collapsed unless this app owns the active session URL.
    return repoMatchesPath(repo, pathname) && pathname.includes("/sessions");
  };

  return (
    <>
      <div className="flex items-center gap-1.5 p-2">
        <SearchInput
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          className="min-w-0 flex-1"
          inputClassName="border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex-1 space-y-1 px-1 pb-2">
        {repos === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : repos.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No apps yet
          </p>
        ) : (
          repos.map((repo) => (
            <GlobalSessionGroup
              key={repo._id}
              repo={repo}
              pathname={pathname}
              searchQuery={searchQuery}
              open={isGroupOpen(repo)}
              onOpenChange={(open) => {
                setOpenByRepoId((prev) => ({ ...prev, [repo._id]: open }));
              }}
              onNavigate={onNavigate}
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
                  try {
                    await updateSession({
                      id: sessionToRename.session._id,
                      title: renameValue.trim(),
                    });
                    setSessionToRename(null);
                  } finally {
                    setIsRenaming(false);
                  }
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
                  try {
                    await updateSession({
                      id: sessionToRename.session._id,
                      title: renameValue.trim(),
                    });
                    setSessionToRename(null);
                  } finally {
                    setIsRenaming(false);
                  }
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
                    onNavigate?.();
                  } finally {
                    setIsArchiving(false);
                  }
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
