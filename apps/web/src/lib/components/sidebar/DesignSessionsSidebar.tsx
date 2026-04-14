"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { SessionListSidebar } from "@/lib/components/sidebar/SessionListSidebar";
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
  const sessions = useQuery(api.designSessions.list, { repoId });
  const archivedSessions = useQuery(api.designSessions.listArchived, {
    repoId,
  });
  const createSession = useMutation(api.designSessions.create);
  const archiveSession = useMutation(api.designSessions.archive);
  const unarchiveSession = useMutation(api.designSessions.unarchive);

  const updateSession = useMutation(api.designSessions.update);

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
        return id;
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
        return id;
      }}
      emptyIcon={<IconPalette size={28} />}
      emptyLabel="No design sessions yet"
      createTitle="New Design Session"
      createPlaceholder="e.g., Dashboard user management page"
      archiveTitle="Archive Design Session"
      searchPlaceholder="Search design sessions..."
    />
  );
}
