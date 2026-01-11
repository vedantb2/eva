"use client";

import { useState } from "react";
import { IconVolume } from "@tabler/icons-react";
import { GenericId as Id } from "convex/values";

interface VocabularyCardProps {
  vocab: {
    _id: Id<"vocabulary">;
    english: string;
    marathi: string;
    pronunciation: string;
    category: string;
  };
}

export function VocabularyCard({ vocab }: VocabularyCardProps) {
  const [flipped, setFlipped] = useState(false);

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "mr-IN";
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className="relative h-40 cursor-pointer perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`absolute inset-0 transition-transform duration-500 transform-style-preserve-3d ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        <div className="absolute inset-0 backface-hidden rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-green-500">
            {vocab.category}
          </span>
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {vocab.english}
            </p>
          </div>
          <span className="text-xs text-neutral-400">Tap to flip</span>
        </div>

        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-green-500 p-4 flex flex-col justify-between">
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(vocab.marathi);
              }}
              className="p-2 hover:bg-green-400 rounded-lg transition-colors"
            >
              <IconVolume className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-1">
              {vocab.marathi}
            </p>
            <p className="text-sm text-green-100">{vocab.pronunciation}</p>
          </div>
          <span className="text-xs text-green-200">Tap to flip</span>
        </div>
      </div>
    </div>
  );
}
