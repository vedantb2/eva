"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation, useConvex } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { SessionListSidebar } from "@/lib/components/sidebar/SessionListSidebar";
import { entityPathSegment } from "@/lib/numId";
import { IconTerminal2 } from "@tabler/icons-react";

type ChatEntry = FunctionReturnType<
  typeof api.sessions.listChatEntries
>[number];

/** Chat entry annotated with the sidebar-computed link + selection state. */
export type SidebarChatEntry = ChatEntry & {
  href: string;
  isSelected: boolean;
};

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
  const convex = useConvex();
  const sessions = useQuery(api.sessions.list, { repoId });
  const archivedSessions = useQuery(api.sessions.listArchived, { repoId });
  const rawChatEntries = useQuery(api.sessions.listChatEntries, { repoId });
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

  // Deep link into the existing project/task sandbox page (defaulting to the
  // "preview" tab) and stay highlighted for any tab under that sandbox.
  const chatEntries: SidebarChatEntry[] | undefined = rawChatEntries
    ?.map((entry) => {
      const entrySegment = entityPathSegment(entry);
      if (!entrySegment) return null;
      const entryBasePath =
        entry.kind === "project"
          ? `${basePath}/projects/${entrySegment}`
          : `${basePath}/quick-tasks/${entrySegment}`;
      const isSelected =
        pathname === entryBasePath || pathname.startsWith(`${entryBasePath}/`);
      return {
        ...entry,
        href: `${entryBasePath}/sandbox/preview`,
        isSelected,
      };
    })
    .filter((entry) => entry !== null);

  return (
    <SessionListSidebar
      sessions={sessions}
      archivedSessions={archivedSessions}
      chatEntries={chatEntries}
      baseUrl={`${basePath}/sessions`}
      pathname={pathname}
      onNavigate={onNavigate}
      createRequestId={createRequestId}
      onCreate={async (title) => {
        const id = await createSession({ repoId, title });
        const session = await convex.query(api.sessions.get, { id });
        const segment = session ? entityPathSegment(session) : null;
        if (!segment) {
          throw new Error("Created session is missing numId");
        }
        return segment;
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
        const created = await convex.query(api.sessions.get, { id });
        const segment = created ? entityPathSegment(created) : null;
        if (!segment) {
          throw new Error("Duplicated session is missing numId");
        }
        return segment;
      }}
      emptyIcon={<IconTerminal2 size={28} />}
      emptyLabel="No sessions yet"
      createTitle="New Session"
      createPlaceholder="e.g., Add user authentication"
      archiveTitle="Archive Session"
      archiveDescription="This will stop the sandbox and remove the session from the active list."
      searchPlaceholder="Search sessions..."
      layoutId="sessions-nav"
    />
  );
}
