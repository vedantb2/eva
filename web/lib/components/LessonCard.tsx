"use client";

import Link from "next/link";
import { IconLock, IconCheck } from "@tabler/icons-react";
import { GenericId as Id } from "convex/values";

interface LessonCardProps {
  lesson: {
    _id: Id<"lessons">;
    title: string;
    titleMarathi: string;
    description: string;
    icon: string;
  };
  progress?: {
    completed: boolean;
    score: number;
  };
  unlocked: boolean;
  index: number;
}

export function LessonCard({
  lesson,
  progress,
  unlocked,
  index,
}: LessonCardProps) {
  const isCompleted = progress?.completed === true;
  const offsetX = index % 2 === 0 ? -30 : 30;

  if (!unlocked) {
    return (
      <div
        className="relative w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center cursor-not-allowed opacity-60"
        style={{ transform: `translateX(${offsetX}px)` }}
      >
        <IconLock className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
      </div>
    );
  }

  return (
    <Link
      href={`/lesson/${lesson._id}`}
      className="relative group"
      style={{ transform: `translateX(${offsetX}px)` }}
    >
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-200 group-hover:scale-110 ${
          isCompleted
            ? "bg-green-500 ring-4 ring-green-200 dark:ring-green-800"
            : "bg-gradient-to-br from-green-400 to-green-600 ring-4 ring-green-200 dark:ring-green-800"
        }`}
      >
        {isCompleted ? (
          <IconCheck className="w-10 h-10 text-white" />
        ) : (
          <span>{lesson.icon}</span>
        )}
      </div>

      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1.5 rounded-lg text-sm font-medium">
          {lesson.title}
        </div>
      </div>

      {progress && progress.score > 0 && (
        <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
          {progress.score}%
        </div>
      )}
    </Link>
  );
}
