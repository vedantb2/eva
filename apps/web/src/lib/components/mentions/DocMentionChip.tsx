"use client";

import type { MouseEvent } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@eva/ui";
import type { Id } from "@eva/backend";
import { MENTION_CHIP_CLASS } from "./mentionChipStyles";
import { DocMentionHoverCardBody } from "./DocMentionHoverCardBody";

interface DocMentionChipProps {
  docId: Id<"docs">;
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function DocMentionChip({ docId, label, onClick }: DocMentionChipProps) {
  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={`${MENTION_CHIP_CLASS} cursor-pointer transition-[background-color] hover:bg-primary/20`}
        >
          @{label}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="top"
        className="w-auto border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
      >
        <DocMentionHoverCardBody docId={docId} />
      </HoverCardContent>
    </HoverCard>
  );
}
