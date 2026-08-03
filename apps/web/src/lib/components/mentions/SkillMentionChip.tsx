"use client";

import type { MouseEvent } from "react";
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from "@eva/ui";
import type { Id } from "@eva/backend";
import { SKILL_CHIP_CLASS } from "./mentionChipStyles";
import { SkillMentionHoverCardBody } from "./SkillMentionHoverCardBody";

interface SkillMentionChipProps {
  skillId: Id<"repoSkills">;
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function SkillMentionChip({
  skillId,
  label,
  onClick,
}: SkillMentionChipProps) {
  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          onClick={onClick}
          className={`${SKILL_CHIP_CLASS} h-auto hover:bg-primary/20 hover:text-accent-foreground`}
        >
          /{label}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="top"
        className="w-auto border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
      >
        <SkillMentionHoverCardBody skillId={skillId} />
      </HoverCardContent>
    </HoverCard>
  );
}
