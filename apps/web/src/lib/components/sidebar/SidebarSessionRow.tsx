"use client";

import { m } from "motion/react";
import type { Id } from "@eva/backend";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@eva/ui";
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
  firstMessagePreview?: string | null;
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
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
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
              userId={session.userId}
              createdAt={session._creationTime}
              status={session.status}
              isSelected={isSelected}
              onNavigate={onNavigate}
              prUrl={session.prUrl}
              prState={session.prState}
              firstMessagePreview={session.firstMessagePreview}
            />
          </SharedLayoutNavSurface>
        </m.div>
      </ContextMenuTrigger>
      <ContextMenuContent onClick={(e) => e.stopPropagation()}>
        {onRename && (
          <ContextMenuItem onSelect={() => onRenameRequest(session)}>
            <IconPencil className="size-4" />
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
            <IconCopy className="size-4" />
            Duplicate
          </ContextMenuItem>
        )}
        <ContextMenuItem
          onSelect={() => {
            void navigator.clipboard.writeText(session.title);
          }}
        >
          <IconClipboard className="size-4" />
          Copy title
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void navigator.clipboard.writeText(window.location.origin + href);
          }}
        >
          <IconLink className="size-4" />
          Copy link
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-warning"
          onSelect={() => onArchiveRequest(session)}
        >
          <IconArchive className="size-4" />
          Archive
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
