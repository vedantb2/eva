"use client";

import type { MouseEvent } from "react";
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from "@eva/ui";
import type { Id } from "@eva/backend";
import { MENTION_CHIP_CLASS } from "./mentionChipStyles";
import { DataMentionHoverCardBody } from "./DataMentionHoverCardBody";

interface DataMentionChipProps {
  entityId: string;
  repoId: Id<"githubRepos">;
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

/** Clickable `@` chip for Data mentions (docs, sessions, projects, tasks). */
export function DataMentionChip({
  entityId,
  repoId,
  label,
  onClick,
}: DataMentionChipProps) {
  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          onClick={onClick}
          className={`${MENTION_CHIP_CLASS} h-auto hover:bg-primary/20 hover:text-accent-foreground`}
        >
          @{label}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="top"
        className="w-auto border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
      >
        <DataMentionHoverCardBody entityId={entityId} repoId={repoId} />
      </HoverCardContent>
    </HoverCard>
  );
}
