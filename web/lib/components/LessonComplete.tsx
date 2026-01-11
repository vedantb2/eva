"use client";

import { useRouter } from "next/navigation";
import { IconBolt, IconTrophy } from "@tabler/icons-react";

interface LessonCompleteProps {
  score: number;
  xpEarned: number;
}

export function LessonComplete({ score, xpEarned }: LessonCompleteProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="text-6xl animate-bounce">🎉</div>

      <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
        Lesson Complete!
      </h2>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <IconTrophy className="w-12 h-12 text-yellow-500" />
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {score}%
          </span>
          <span className="text-sm text-neutral-500">Accuracy</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <IconBolt className="w-12 h-12 text-green-500" />
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            +{xpEarned}
          </span>
          <span className="text-sm text-neutral-500">XP Earned</span>
        </div>
      </div>

      <button
        onClick={() => router.push("/learn")}
        className="mt-8 px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
