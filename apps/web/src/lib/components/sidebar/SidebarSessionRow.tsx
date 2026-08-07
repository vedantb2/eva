"use client";

import { m } from "motion/react";
import type { Id } from "@eva/backend";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  toast,
} from "@eva/ui";
import {
  IconArchive,
  IconArchiveOff,
  IconClipboard,
  IconCopy,
  IconExternalLink,
  IconGitBranch,
  IconLink,
  IconPencil,
} from "@tabler/icons-react";
import { entityPathSegment } from "@/lib/numId";
import { SidebarSessionItem } from "@/lib/components/sidebar/SidebarSessionItem";
import { SharedLayoutNavSurface } from "@/lib/components/sidebar/SharedLayoutNav";

type SessionStatus = "active" | "starting" | "stopping" | "closed";

interface SessionItem {
  _id: Id<"sessions">;
  numId?: number;
  _creationTime: number;
  userId: Id<"users">;
  title: string;
  status: SessionStatus;
  updatedAt?: number;
  sandboxId?: string;
  branchName?: string;
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
  const branchName = session.branchName;
  const prUrl = session.prUrl;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
        >
          <SharedLayoutNavSurface
            itemId={session._id}
            isActive={isSelected}
            className="group mx-1 rounded-menu-item"
          >
            <SidebarSessionItem
              href={href}
              title={session.title}
              sessionId={session._id}
              userId={session.userId}
              createdAt={session._creationTime}
              updatedAt={session.updatedAt}
              status={session.status}
              isSelected={isSelected}
              onNavigate={onNavigate}
              prUrl={prUrl}
              prState={session.prState}
            />
          </SharedLayoutNavSurface>
        </m.div>
      </ContextMenuTrigger>
      <ContextMenuContent onClick={(e) => e.stopPropagation()}>
        {!isArchivedList && onRename && onRenameRequest ? (
          <ContextMenuItem onSelect={() => onRenameRequest(session)}>
            <IconPencil size={16} />
            Rename
          </ContextMenuItem>
        ) : null}
        {!isArchivedList && onDuplicate && onDuplicateNavigate ? (
          <ContextMenuItem
            onSelect={() => {
              void onDuplicate(session).then((newPathSegment) => {
                onDuplicateNavigate(newPathSegment);
              });
            }}
          >
            <IconCopy size={16} />
            Duplicate
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem
          onSelect={() => {
            void navigator.clipboard.writeText(session.title);
          }}
        >
          <IconClipboard size={16} />
          Copy title
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void navigator.clipboard.writeText(window.location.origin + href);
          }}
        >
          <IconLink size={16} />
          Copy link
        </ContextMenuItem>
        {branchName ? (
          <ContextMenuItem
            onSelect={() => {
              void navigator.clipboard.writeText(branchName).then(() => {
                toast.success("Branch name copied");
              });
            }}
          >
            <IconGitBranch size={16} />
            Copy branch name
          </ContextMenuItem>
        ) : null}
        {prUrl ? (
          <ContextMenuItem
            onSelect={() => {
              window.open(prUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <IconExternalLink size={16} />
            Open PR
          </ContextMenuItem>
        ) : null}
        {isArchivedList && onUnarchive ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => {
                void onUnarchive(session);
              }}
            >
              <IconArchiveOff size={16} />
              Unarchive
            </ContextMenuItem>
          </>
        ) : null}
        {!isArchivedList && onArchiveRequest ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-warning"
              onSelect={() => onArchiveRequest(session)}
            >
              <IconArchive size={16} />
              Archive
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
