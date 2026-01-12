"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { Button } from "@/lib/components/ui/Button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { PlanStatusBadge } from "@/lib/components/plans/PlanStatusBadge";
import { NewPlanModal } from "@/lib/components/plans/NewPlanModal";
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

  return (
    <>
      <PageHeader
        title="Plan"
        headerRight={
          <Button onClick={() => setIsCreating(true)}>
            <IconPlus size={16} className="mr-1" />
            New Plan
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
                  className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <Link href={planUrl} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-pink-600 transition-colors truncate">
                          {plan.title}
                        </h3>
                        <PlanStatusBadge state={plan.state} />
                      </div>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {plan.rawInput}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <Tooltip
                        content={
                          canInterview
                            ? "Interview to refine requirements"
                            : "Feature already created - plan is locked"
                        }
                      >
                        <span>
                          <Link
                            href={canInterview ? `${planUrl}?interview=true` : "#"}
                            onClick={(e) => {
                              if (!canInterview) e.preventDefault();
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              canInterview
                                ? "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 hover:text-pink-600"
                                : "text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                            }`}
                          >
                            <IconMessageQuestion size={20} />
                          </Link>
                        </span>
                      </Tooltip>
                      <Link
                        href={planUrl}
                        className="text-neutral-400 group-hover:text-pink-600 transition-colors"
                      >
                        <IconChevronRight size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
      <NewPlanModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </>
  );
}
