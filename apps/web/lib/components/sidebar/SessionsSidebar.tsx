"use client";

import { useMutation, useQuery } from "convex/react";
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
  const archiveSession = useMutation(api.sessions.archive);
  const stopSandboxMutation = useMutation(api.sessions.stopSandbox);

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
