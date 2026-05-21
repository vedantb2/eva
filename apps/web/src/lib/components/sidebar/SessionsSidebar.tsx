"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { SessionListSidebar } from "@/lib/components/sidebar/SessionListSidebar";
import { IconTerminal2 } from "@tabler/icons-react";

interface SessionsSidebarProps {
  repoId: Id<"githubRepos">;
  basePath: string;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function SessionsSidebar({
  repoId,
  basePath,
  pathname,
  onNavigate,
  createRequestId,
}: SessionsSidebarProps) {
  const sessions = useQuery(api.sessions.list, { repoId });
  const archivedSessions = useQuery(api.sessions.listArchived, { repoId });
  const createSession = useMutation(api.sessions.create);
  const archiveSession = useMutation(api.sessions.archive).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.sessions.list, { repoId });
      if (current !== undefined) {
        const session = current.find((s) => s._id === args.id);
        localStore.setQuery(
          api.sessions.list,
          { repoId },
          current.filter((s) => s._id !== args.id),
        );
        if (session) {
          const archived = localStore.getQuery(api.sessions.listArchived, {
            repoId,
          });
          if (archived !== undefined) {
            localStore.setQuery(api.sessions.listArchived, { repoId }, [
              { ...session, archived: true },
              ...archived,
            ]);
          }
        }
      }
    },
  );
  const unarchiveSession = useMutation(
    api.sessions.unarchive,
  ).withOptimisticUpdate((localStore, args) => {
    const archived = localStore.getQuery(api.sessions.listArchived, {
      repoId,
    });
    if (archived !== undefined) {
      const session = archived.find((s) => s._id === args.id);
      localStore.setQuery(
        api.sessions.listArchived,
        { repoId },
        archived.filter((s) => s._id !== args.id),
      );
      if (session) {
        const current = localStore.getQuery(api.sessions.list, { repoId });
        if (current !== undefined) {
          localStore.setQuery(api.sessions.list, { repoId }, [
            { ...session, archived: false },
            ...current,
          ]);
        }
      }
    }
  });
  const stopSandboxMutation = useMutation(api.sessions.stopSandbox);

  const updateSession = useMutation(api.sessions.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.sessions.list, { repoId });
      if (current !== undefined) {
        localStore.setQuery(
          api.sessions.list,
          { repoId },
          current.map((s) =>
            s._id === args.id ? { ...s, ...args, _id: s._id } : s,
          ),
        );
      }
    },
  );

  return (
    <SessionListSidebar
      sessions={sessions}
      archivedSessions={archivedSessions}
      baseUrl={`${basePath}/sessions`}
      pathname={pathname}
      onNavigate={onNavigate}
      createRequestId={createRequestId}
      onCreate={async (title) => {
        const id = await createSession({ repoId, title });
        return id;
      }}
      onArchive={async (session) => {
        if (session.sandboxId) {
          await stopSandboxMutation({ sessionId: session._id });
        }
        await archiveSession({ id: session._id });
      }}
      onUnarchive={async (session) => {
        await unarchiveSession({ id: session._id });
      }}
      onRename={async (session, newTitle) => {
        await updateSession({
          id: session._id,
          title: newTitle,
        });
      }}
      onDuplicate={async (session) => {
        const id = await createSession({
          repoId,
          title: `${session.title} (copy)`,
        });
        return id;
      }}
      emptyIcon={<IconTerminal2 size={28} />}
      emptyLabel="No sessions yet"
      createTitle="New Session"
      createPlaceholder="e.g., Add user authentication"
      archiveTitle="Archive Session"
      archiveDescription="This will stop the sandbox and remove the session from the active list."
      searchPlaceholder="Search sessions..."
    />
  );
}
