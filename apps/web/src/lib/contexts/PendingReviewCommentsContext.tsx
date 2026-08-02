"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ReviewComment } from "@/lib/reviewComments";

interface PendingReviewCommentsValue {
  readonly comments: ReadonlyArray<ReviewComment>;
  add: (comment: ReviewComment) => void;
  remove: (commentId: string) => void;
  clear: () => void;
  openDiffsTab: () => void;
}

const PendingReviewCommentsContext =
  createContext<PendingReviewCommentsValue | null>(null);

export function PendingReviewCommentsProvider({
  children,
  onOpenDiffsTab,
}: {
  children: ReactNode;
  onOpenDiffsTab: () => void;
}) {
  const [comments, setComments] = useState<ReviewComment[]>([]);

  const add = (comment: ReviewComment) => {
    setComments((current) => [...current, comment]);
  };

  const remove = (commentId: string) => {
    setComments((current) =>
      current.filter((comment) => comment.id !== commentId),
    );
  };

  const clear = () => {
    setComments([]);
  };

  const value: PendingReviewCommentsValue = {
    comments,
    add,
    remove,
    clear,
    openDiffsTab: onOpenDiffsTab,
  };

  return (
    <PendingReviewCommentsContext value={value}>
      {children}
    </PendingReviewCommentsContext>
  );
}

export function usePendingReviewComments():
  | PendingReviewCommentsValue
  | undefined {
  const value = useContext(PendingReviewCommentsContext);
  return value ?? undefined;
}
