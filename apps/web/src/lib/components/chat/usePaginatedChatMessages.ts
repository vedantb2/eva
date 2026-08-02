"use client";

import { api } from "@eva/backend";
import { usePaginatedQuery } from "convex/react";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { useLayoutEffect, useRef, useState } from "react";

const INITIAL_MESSAGE_COUNT = 50;
const INITIAL_FIRST_ITEM_INDEX = 1_000_000;

type MessagePage = FunctionReturnType<
  typeof api.messages.listByParentPaginated
>;

export type ChatMessage = MessagePage["page"][number];

type ChatParentId = FunctionArgs<
  typeof api.messages.listByParentPaginated
>["parentId"];

/** Loads newest-first Convex pages and exposes one chronological message list. */
export function usePaginatedChatMessages(parentId: ChatParentId) {
  const pagination = usePaginatedQuery(
    api.messages.listByParentPaginated,
    { parentId },
    { initialNumItems: INITIAL_MESSAGE_COUNT },
  );
  const [firstItemIndex, setFirstItemIndex] = useState(
    INITIAL_FIRST_ITEM_INDEX,
  );
  const previousParentRef = useRef<ChatParentId>(parentId);
  const previousOldestIdRef = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const oldest = pagination.results[pagination.results.length - 1];
    if (previousParentRef.current !== parentId) {
      previousParentRef.current = parentId;
      previousOldestIdRef.current = oldest?._id;
      setFirstItemIndex(INITIAL_FIRST_ITEM_INDEX);
      return;
    }
    const previousOldestId = previousOldestIdRef.current;
    previousOldestIdRef.current = oldest?._id;
    if (!previousOldestId || !oldest || oldest._id === previousOldestId) {
      return;
    }
    const previousOldestIndex = pagination.results.findIndex(
      (message) => message._id === previousOldestId,
    );
    if (previousOldestIndex < 0) return;
    const prependedCount = pagination.results.length - previousOldestIndex - 1;
    if (prependedCount > 0) {
      setFirstItemIndex((current) => current - prependedCount);
    }
  }, [parentId, pagination.results]);

  return {
    messages: pagination.results.toReversed(),
    firstItemIndex,
    canLoadOlder: pagination.status === "CanLoadMore",
    isLoadingOlder: pagination.status === "LoadingMore",
    loadOlder: () => pagination.loadMore(INITIAL_MESSAGE_COUNT),
  };
}
