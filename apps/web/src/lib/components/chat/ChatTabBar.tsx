"use client";

import { useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@eva/ui";
import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconPlus,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { ChatTab } from "./useChatTabs";

interface ChatTabBarProps {
  chats: ChatTab[];
  activeChat: ChatTab | undefined;
  onSelect: (chat: ChatTab | null) => void;
  onAdd: () => Promise<void>;
  disabled?: boolean;
}

function RunningDot() {
  return <span className="size-1.5 shrink-0 rounded-full bg-success" />;
}

export function ChatTabBar({
  chats,
  activeChat,
  onSelect,
  onAdd,
  disabled = false,
}: ChatTabBarProps) {
  const [creating, setCreating] = useState(false);
  const rename = useMutation(api.chats.rename);
  const setArchived = useMutation(api.chats.setArchived);
  const visible = chats.filter((chat) => !chat.archived);
  const archived = chats.filter((chat) => chat.archived);

  const renameChat = (chat: ChatTab) => {
    const title = window.prompt("Rename chat", chat.title ?? "New chat");
    if (title?.trim()) void rename({ id: chat._id, title });
  };

  return (
    <div className="flex h-9 shrink-0 items-center border-b border-border bg-background px-1">
      <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-thin">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "relative flex h-9 shrink-0 items-center gap-2 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground",
            !activeChat &&
              "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-foreground",
          )}
        >
          Main
        </button>
        {visible.map((chat) => (
          <div
            key={chat._id}
            className="group relative flex shrink-0 items-center"
          >
            <button
              type="button"
              onClick={() => onSelect(chat)}
              onDoubleClick={() => renameChat(chat)}
              className={cn(
                "relative flex h-9 max-w-48 items-center gap-2 py-0 pl-3 pr-8 text-xs text-muted-foreground transition-colors hover:text-foreground",
                activeChat?._id === chat._id &&
                  "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-foreground",
              )}
            >
              {chat.isRunning ? <RunningDot /> : null}
              <span className="truncate">{chat.title ?? "New chat"}</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Actions for ${chat.title ?? "New chat"}`}
                  className="absolute right-1 flex size-6 items-center justify-center rounded-sm text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <IconDots size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => renameChat(chat)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={chat.isRunning}
                  onSelect={() => {
                    void setArchived({ id: chat._id, archived: true });
                    if (activeChat?._id === chat._id) onSelect(null);
                  }}
                >
                  <IconArchive size={14} /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {archived.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 shrink-0 items-center gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <IconArchive size={13} /> {archived.length}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {archived.map((chat) => (
              <DropdownMenuItem key={chat._id} onSelect={() => onSelect(chat)}>
                <span className="min-w-0 flex-1 truncate">
                  {chat.title ?? "New chat"}
                </span>
                <button
                  type="button"
                  aria-label="Unarchive chat"
                  onClick={(event) => {
                    event.stopPropagation();
                    void setArchived({ id: chat._id, archived: false });
                  }}
                >
                  <IconArchiveOff size={14} />
                </button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <Button
        variant="ghost"
        size="icon-sm"
        title="New chat"
        disabled={disabled || creating}
        onClick={() => {
          setCreating(true);
          void onAdd().finally(() => setCreating(false));
        }}
      >
        <IconPlus size={15} />
      </Button>
    </div>
  );
}
