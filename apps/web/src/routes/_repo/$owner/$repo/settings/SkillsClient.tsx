"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { AddSkillForm } from "./skills/_components/AddSkillForm";
import { SkillRow } from "./skills/_components/SkillRow";

export function SkillsClient() {
  const { repoId } = useRepo();
  const skills = useQuery(api.repoSkills.listByRepo, { repoId });

  if (!skills) return null;

  return (
    <PageWrapper title="Skills" comfortable>
      <div className="rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4">
        <div>
          <h3 className="text-sm font-medium">Repo Skills</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Reusable prompts for sandbox chat. Type <code>/</code> in session,
            task, or project chat to insert a skill.
          </p>
        </div>

        {skills.length > 0 ? (
          <div className="grid gap-2">
            {skills.map((skill) => (
              <SkillRow key={skill._id} skill={skill} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No skills configured yet.
          </p>
        )}

        <AddSkillForm repoId={repoId} />
      </div>
    </PageWrapper>
  );
}
