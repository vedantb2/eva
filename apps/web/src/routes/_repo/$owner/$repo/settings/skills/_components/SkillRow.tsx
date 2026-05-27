"use client";

import { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Button } from "@conductor/ui";
import { IconFileText } from "@tabler/icons-react";
import { SkillContentDialog } from "./SkillContentDialog";

type Skill = FunctionReturnType<typeof api.repoSkills.listByRepo>[number];

export function SkillRow({ skill }: { skill: Skill }) {
  const [contentOpen, setContentOpen] = useState(false);

  return (
    <>
      <div
        className={
          "rounded-md p-3 " +
          (skill.available ? "bg-muted/40" : "bg-muted/30 opacity-70")
        }
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="text-xs font-medium">{skill.title}</p>
              {!skill.available ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Stale
                </span>
              ) : null}
            </div>
            {skill.sourcePath ? (
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
                {skill.sourcePath}
              </p>
            ) : null}
          </div>
          {skill.sourcePath ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setContentOpen(true)}
            >
              <IconFileText size={14} />
              View contents
            </Button>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-3 text-[11px] text-muted-foreground">
          {skill.description || "No description found in SKILL.md."}
        </p>
      </div>

      <SkillContentDialog
        skillId={skill._id}
        title={skill.title}
        sourcePath={skill.sourcePath}
        open={contentOpen}
        onOpenChange={setContentOpen}
      />
    </>
  );
}
