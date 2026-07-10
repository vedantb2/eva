"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation, useConvex } from "convex/react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { SessionListSidebar } from "@/lib/components/sidebar/SessionListSidebar";
import { entityPathSegment } from "@/lib/numId";
import { IconPalette } from "@tabler/icons-react";

interface DesignSessionsSidebarProps {
  repoId: Id<"githubRepos">;
  basePath: string;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function DesignSessionsSidebar({
  repoId,
  basePath,
  pathname,
  onNavigate,
  createRequestId,
}: DesignSessionsSidebarProps) {
  const convex = useConvex();
  const sessions = useQuery(api.designSessions.list, { repoId });
  const archivedSessions = useQuery(api.designSessions.listArchived, {
    repoId,
  });
  const createSession = useMutation(api.designSessions.create);
  const archiveSession = useMutation(
    api.designSessions.archive,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.designSessions.list, { repoId });
    if (current !== undefined) {
      const session = current.find((s) => s._id === args.id);
      localStore.setQuery(
        api.designSessions.list,
        { repoId },
        current.filter((s) => s._id !== args.id),
      );
      if (session) {
        const archived = localStore.getQuery(api.designSessions.listArchived, {
          repoId,
        });
        if (archived !== undefined) {
          localStore.setQuery(api.designSessions.listArchived, { repoId }, [
            { ...session, archived: true },
            ...archived,
          ]);
        }
      }
    }
  });
  const unarchiveSession = useMutation(
    api.designSessions.unarchive,
  ).withOptimisticUpdate((localStore, args) => {
    const archived = localStore.getQuery(api.designSessions.listArchived, {
      repoId,
    });
    if (archived !== undefined) {
      const session = archived.find((s) => s._id === args.id);
      localStore.setQuery(
        api.designSessions.listArchived,
        { repoId },
        archived.filter((s) => s._id !== args.id),
      );
      if (session) {
        const current = localStore.getQuery(api.designSessions.list, {
          repoId,
        });
        if (current !== undefined) {
          localStore.setQuery(api.designSessions.list, { repoId }, [
            { ...session, archived: false },
            ...current,
          ]);
        }
      }
    }
  });

  const updateSession = useMutation(
    api.designSessions.update,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.designSessions.list, { repoId });
    if (current !== undefined) {
      localStore.setQuery(
        api.designSessions.list,
        { repoId },
        current.map((s) =>
          s._id === args.id ? { ...s, ...args, _id: s._id } : s,
        ),
      );
    }
  });

  return (
    <SessionListSidebar
      sessions={sessions}
      archivedSessions={archivedSessions}
      baseUrl={`${basePath}/designs`}
      pathname={pathname}
      onNavigate={onNavigate}
      createRequestId={createRequestId}
      onCreate={async (title) => {
        const id = await createSession({ repoId, title });
        const session = await convex.query(api.designSessions.get, { id });
        const segment = session ? entityPathSegment(session) : null;
        if (!segment) {
          throw new Error("Created design session is missing numId");
        }
        return segment;
      }}
      onArchive={async (session) => {
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
        const created = await convex.query(api.designSessions.get, { id });
        const segment = created ? entityPathSegment(created) : null;
        if (!segment) {
          throw new Error("Duplicated design session is missing numId");
        }
        return segment;
      }}
      emptyIcon={<IconPalette size={28} />}
      emptyLabel="No design sessions yet"
      createTitle="New Design Session"
      createPlaceholder="e.g., Dashboard user management page"
      archiveTitle="Archive Design Session"
      searchPlaceholder="Search design sessions..."
      layoutId="designs-nav"
    />
  );
}
