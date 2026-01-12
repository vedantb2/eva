"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { PlanConversation } from "@/lib/components/plan/PlanConversation";
import { PlanFinalizationModal } from "@/lib/components/plan/PlanFinalizationModal";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";

interface PlanDetailClientProps {
  planId: string;
}

export function PlanDetailClient({ planId }: PlanDetailClientProps) {
  const { fullName } = useRepo();
  const typedPlanId = planId as Id<"plans">;

  const plan = useQuery(api.plans.get, { id: typedPlanId });
  const [generatedSpec, setGeneratedSpec] = useState<string | null>(null);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);

  const handleSpecGenerated = (spec: string) => {
    setGeneratedSpec(spec);
    setShowFinalizationModal(true);
  };

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
      <PageHeader title={plan.title} />
      <div className="flex-1 overflow-hidden">
        <PlanConversation
          planId={typedPlanId}
          planState={plan.state}
          initialMessages={plan.conversationHistory}
          onSpecGenerated={handleSpecGenerated}
        />
      </div>
      {generatedSpec && (
        <PlanFinalizationModal
          isOpen={showFinalizationModal}
          onClose={() => setShowFinalizationModal(false)}
          planId={typedPlanId}
          spec={generatedSpec}
          repoSlug={encodeRepoSlug(fullName)}
        />
      )}
    </div>
  );
}
