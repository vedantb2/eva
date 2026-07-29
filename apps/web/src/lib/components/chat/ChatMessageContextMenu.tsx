"use client";

import type { ReactElement } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@eva/ui";
import { IconCopy, IconMarkdown } from "@tabler/icons-react";
import { tokenizedToDisplayText } from "@/lib/components/mentions";

interface ChatMessageContextMenuProps {
  /** Stored message body (may include mention/skill tokens + markdown). */
  content: string;
  children: ReactElement;
}

async function copyText(value: string): Promise<void> {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

/**
 * Right-click menu for chat bubbles: copy readable text or raw markdown.
 * Wrap the message row; no-ops when content is empty.
 */
export function ChatMessageContextMenu({
  content,
  children,
}: ChatMessageContextMenuProps) {
  const trimmed = content.trim();
  if (!trimmed) return children;

  const plain = tokenizedToDisplayText(content);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onSelect={() => {
            void copyText(plain);
          }}
        >
          <IconCopy size={16} />
          Copy message
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void copyText(content);
          }}
        >
          <IconMarkdown size={16} />
          Copy as markdown
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
