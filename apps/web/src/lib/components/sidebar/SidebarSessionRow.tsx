"use client";

import { motion } from "motion/react";
import type { Id } from "@conductor/backend";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@conductor/ui";
import {
  IconArchive,
  IconClipboard,
  IconCopy,
  IconLink,
  IconPencil,
} from "@tabler/icons-react";
import { entityPathSegment } from "@/lib/numId";
import { SidebarSessionItem } from "@/lib/components/sidebar/SidebarSessionItem";
import { SharedLayoutNavSurface } from "@/lib/components/sidebar/SharedLayoutNav";

type SessionStatus = "active" | "starting" | "stopping" | "closed";

interface SessionItem {
  _id: string;
  numId?: number;
  _creationTime: number;
  userId: Id<"users">;
  title: string;
  status: SessionStatus;
  updatedAt?: number;
  sandboxId?: string;
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
  onArchiveRequest: (session: T) => void;
  onDuplicateNavigate: (pathSegment: string) => void;
  onRenameRequest: (session: T) => void;
}

/**
 * One active (non-archived) session row: the visual item plus its right-click
 * context menu (rename/duplicate/copy/archive). Extracted from
 * `SessionListSidebar` to keep that file under the component-size guideline.
 */
export function SidebarSessionRow<T extends SessionItem>({
  session,
  isSelected,
  baseUrl,
  onNavigate,
  onRename,
  onDuplicate,
  onArchiveRequest,
  onDuplicateNavigate,
  onRenameRequest,
}: SidebarSessionRowProps<T>) {
  const pathSegment = entityPathSegment(session);
  const href = pathSegment ? `${baseUrl}/${pathSegment}` : baseUrl;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <SharedLayoutNavSurface
            itemId={session._id}
            isActive={isSelected}
            className="group mx-1 rounded-menu-item px-3 py-1.5"
          >
            <SidebarSessionItem
              href={href}
              title={session.title}
              userId={session.userId}
              createdAt={session._creationTime}
              updatedAt={session.updatedAt}
              status={session.status}
              isSelected={isSelected}
              onNavigate={onNavigate}
              prUrl={session.prUrl}
              prState={session.prState}
            />
          </SharedLayoutNavSurface>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent onClick={(e) => e.stopPropagation()}>
        {onRename && (
          <ContextMenuItem onSelect={() => onRenameRequest(session)}>
            <IconPencil size={16} />
            Rename
          </ContextMenuItem>
        )}
        {onDuplicate && (
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
        )}
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
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-warning"
          onSelect={() => onArchiveRequest(session)}
        >
          <IconArchive size={16} />
          Archive
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
