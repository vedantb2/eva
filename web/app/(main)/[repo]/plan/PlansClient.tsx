"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { Button } from "@heroui/button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { PlanStatusBadge } from "@/lib/components/plans/PlanStatusBadge";
import { NewPlanModal } from "@/lib/components/plans/NewPlanModal";
import { PlanInterviewModal } from "@/lib/components/plans/PlanInterviewModal";
import {
  IconSparkles,
  IconPlus,
  IconChevronRight,
  IconMessageQuestion,
} from "@tabler/icons-react";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { Tooltip } from "@heroui/tooltip";
import { useState } from "react";

export function PlansClient() {
  const { repo, fullName } = useRepo();
  const plans = useQuery(api.plans.list, { repoId: repo._id });
  const [isCreating, setIsCreating] = useState(false);
  const [interviewPlanId, setInterviewPlanId] = useState<Id<"plans"> | null>(null);

  return (
    <>
      <PageHeader
        title="Plan"
        headerRight={
          <Button onPress={() => setIsCreating(true)} size="sm">
            <IconPlus size={16} className="sm:mr-1" />
            <span className="hidden sm:inline">New Plan</span>
          </Button>
        }
      />
      <Container>
        {plans === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={IconSparkles}
            title="No plans yet"
            description="Create a plan to describe a feature and let AI help you break it down into tasks"
            actionLabel="Create Plan"
            onAction={() => setIsCreating(true)}
          />
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const canInterview = plan.state !== "feature_created";
              const planUrl =
                "/" + encodeRepoSlug(fullName) + "/plan/" + plan._id;
              return (
                <div
                  key={plan._id}
                  className="p-3 sm:p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    <Link href={planUrl} className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-pink-600 transition-colors truncate max-w-full">
                          {plan.title}
                        </h3>
                        <PlanStatusBadge state={plan.state} />
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {plan.rawInput}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Tooltip
                        content={
                          canInterview
                            ? "Interview to refine requirements"
                            : "Feature already created - plan is locked"
                        }
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (canInterview) setInterviewPlanId(plan._id);
                          }}
                          disabled={!canInterview}
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                            canInterview
                              ? "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 hover:text-pink-600"
                              : "text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                          }`}
                        >
                          <IconMessageQuestion size={18} className="sm:hidden" />
                          <IconMessageQuestion size={20} className="hidden sm:block" />
                        </button>
                      </Tooltip>
                      <Link
                        href={planUrl}
                        className="text-neutral-400 group-hover:text-pink-600 transition-colors p-1"
                      >
                        <IconChevronRight size={18} className="sm:hidden" />
                        <IconChevronRight size={20} className="hidden sm:block" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
      <NewPlanModal isOpen={isCreating} onClose={() => setIsCreating(false)} />
      {interviewPlanId && (
        <PlanInterviewModal
          isOpen={!!interviewPlanId}
          onClose={() => setInterviewPlanId(null)}
          planId={interviewPlanId}
        />
      )}
    </>
  );
}
