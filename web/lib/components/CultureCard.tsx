"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react";

interface CultureCardProps {
  card: {
    _id: Id<"cultureCards">;
    title: string;
    titleMarathi: string;
    category: string;
    content: string;
    contentMarathi: string;
    icon: string;
  };
  isRead: boolean;
}

export function CultureCard({ card, isRead }: CultureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const markAsRead = useMutation(api.culture.markCardAsRead);

  const handleExpand = async () => {
    setExpanded(!expanded);
    if (!expanded && !isRead) {
      await markAsRead({ cultureCardId: card._id });
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 cursor-pointer ${
        isRead
          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
          : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
      }`}
      onClick={handleExpand}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{card.icon}</span>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
              {card.title}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {card.titleMarathi}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRead && <IconCheck className="w-5 h-5 text-green-500" />}
          {expanded ? (
            <IconChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <IconChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
          <p className="text-neutral-700 dark:text-neutral-300 mb-3">
            {card.content}
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm italic">
            {card.contentMarathi}
          </p>
        </div>
      )}
    </div>
  );
}
