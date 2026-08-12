"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { parseAsString, useQueryState } from "nuqs";
import { api, type Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";

type ChatParentId = Id<"sessions"> | Id<"projects"> | Id<"agentTasks">;
export type ChatTab = FunctionReturnType<typeof api.chats.listByParent>[number];

const chatParser = parseAsString.withOptions({ history: "replace" });

/** Owns the URL-backed active lane and validates it against the parent. */
export function useChatTabs(parentId: ChatParentId, enabled = true) {
  const chats = useQuery(
    api.chats.listByParent,
    enabled ? { parentId } : "skip",
  );
  const [chatParam, setChatParam] = useQueryState("chat", chatParser);
  const createChat = useMutation(api.chats.create);
  const prewarm = useMutation(api.chats.prewarmDaemon);
  const activeChat = chats?.find((chat) => String(chat._id) === chatParam);

  useEffect(() => {
    if (!enabled || chats === undefined || chatParam === null) return;
    if (!activeChat) void setChatParam(null);
  }, [activeChat, chatParam, chats, enabled, setChatParam]);

  useEffect(() => {
    if (!enabled || !activeChat || activeChat.archived) return;
    void prewarm({ id: activeChat._id });
  }, [activeChat, enabled, prewarm]);

  const selectChat = (chat: ChatTab | null) => {
    void setChatParam(chat ? String(chat._id) : null);
  };

  const addChat = async () => {
    const id = await createChat({ parentId });
    await setChatParam(String(id));
  };

  return {
    chats: chats ?? [],
    isLoading: chats === undefined,
    activeChat,
    selectChat,
    addChat,
  };
}
