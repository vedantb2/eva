"use client";

import { m } from "motion/react";
import type { Id } from "@eva/backend";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  motionFast,
} from "@eva/ui";
import { entityPathSegment } from "@/lib/numId";
import { SidebarSessionItem } from "@/lib/components/sidebar/SidebarSessionItem";
import {
  SessionMenuItems,
  useIsRegeneratingTitle,
} from "@/lib/components/sidebar/SessionMenuItems";
import { SharedLayoutNavSurface } from "@/lib/components/sidebar/SharedLayoutNav";

type SessionStatus = "active" | "starting" | "stopping" | "closed";

interface SessionItem {
  _id: Id<"sessions">;
  numId?: number;
  _creationTime: number;
  userId: Id<"users">;
  title: string;
  titleRegeneration?: { startedAt: number };
  status: SessionStatus;
  isExecuting?: boolean;
  isOrchestrator?: boolean;
  updatedAt?: number;
  sandboxId?: string;
  branchName?: string;
  baseBranch?: string;
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
}

interface SidebarSessionRowProps<T extends SessionItem> {
  session: T;
  isSelected: boolean;
  baseUrl: string;
  onNavigate?: () => void;
  onRename?: (session: T, newTitle: string) => Promise<void>;
  onDuplicate?: (session: T) => Promise<string>;
  /** Active list: archive. Omit in archived list. */
  onArchiveRequest?: (session: T) => void;
  /** Archived list: unarchive. */
  onUnarchive?: (session: T) => Promise<void>;
  onDuplicateNavigate?: (pathSegment: string) => void;
  onRenameRequest?: (session: T) => void;
}

/**
 * One session row plus context menu. Active list gets rename/duplicate/archive;
 * archived list gets unarchive.
 */
export function SidebarSessionRow<T extends SessionItem>({
  session,
  isSelected,
  baseUrl,
  onNavigate,
  onRename,
  onDuplicate,
  onArchiveRequest,
  onUnarchive,
  onDuplicateNavigate,
  onRenameRequest,
}: SidebarSessionRowProps<T>) {
  const pathSegment = entityPathSegment(session);
  const href = pathSegment ? `${baseUrl}/${pathSegment}` : baseUrl;
  const isArchivedList = onUnarchive !== undefined;
  const isRegeneratingTitle = useIsRegeneratingTitle(session);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={motionFast}
        >
          <SharedLayoutNavSurface
            itemId={session._id}
            isActive={isSelected}
            className="group mx-1 rounded-menu-item"
          >
            <SidebarSessionItem
              href={href}
              title={session.title}
              isRegeneratingTitle={isRegeneratingTitle}
              sessionId={session._id}
              userId={session.userId}
              createdAt={session._creationTime}
              updatedAt={session.updatedAt}
              status={session.status}
              isExecuting={session.isExecuting === true}
              isOrchestrator={session.isOrchestrator === true}
              isSelected={isSelected}
              onNavigate={onNavigate}
              prUrl={session.prUrl}
              prState={session.prState}
              baseBranch={session.baseBranch}
            />
          </SharedLayoutNavSurface>
        </m.div>
      </ContextMenuTrigger>
      <ContextMenuContent onClick={(e) => e.stopPropagation()}>
        <SessionMenuItems
          session={session}
          href={href}
          isRegeneratingTitle={isRegeneratingTitle}
          onRenameRequest={
            !isArchivedList && onRename && onRenameRequest
              ? () => onRenameRequest(session)
              : undefined
          }
          onDuplicate={
            !isArchivedList && onDuplicate
              ? () => onDuplicate(session)
              : undefined
          }
          onDuplicateNavigate={onDuplicateNavigate}
          onUnarchive={
            isArchivedList && onUnarchive ? () => onUnarchive(session) : undefined
          }
          onArchiveRequest={
            !isArchivedList && onArchiveRequest
              ? () => onArchiveRequest(session)
              : undefined
          }
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}
