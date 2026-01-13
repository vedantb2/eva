"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { PlanTabs } from "@/lib/components/plan/PlanTabs";
import { PlanStatusBadge } from "@/lib/components/plans/PlanStatusBadge";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";

interface PlanDetailClientProps {
  planId: string;
}

export function PlanDetailClient({ planId }: PlanDetailClientProps) {
  const { fullName, repo } = useRepo();
  const typedPlanId = planId as Id<"plans">;

  const plan = useQuery(api.plans.get, { id: typedPlanId });

  if (plan === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
      </div>
    );
  }

  if (plan === null) {
    return (
      <Container>
        <div className="py-12 text-center">
          <p className="text-neutral-500">Plan not found</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={plan.title}
        headerRight={<PlanStatusBadge state={plan.state} />}
      />
      <div className="flex-1 overflow-hidden">
        <PlanTabs
          planId={typedPlanId}
          planState={plan.state}
          rawInput={plan.rawInput}
          generatedSpec={plan.generatedSpec}
          codebaseIndex={plan.codebaseIndex}
          indexingStatus={plan.indexingStatus}
          conversationHistory={plan.conversationHistory}
          repoSlug={encodeRepoSlug(fullName)}
          repoOwner={repo.owner}
          repoName={repo.name}
        />
      </div>
    </div>
  );
}
