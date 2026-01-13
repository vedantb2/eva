"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useRouter } from "next/navigation";
import { parseSpec } from "@/lib/utils/parseSpec";
import { IconRocket, IconMessageQuestion, IconCircleCheck } from "@tabler/icons-react";

type PlanState = "draft" | "finalized" | "feature_created";

interface PlanTabProps {
  planId: Id<"plans">;
  planState: PlanState;
  generatedSpec: string | undefined;
  repoSlug: string;
  onStartInterview: () => void;
}

export function PlanTab({
  planId,
  planState,
  generatedSpec,
  repoSlug,
  onStartInterview,
}: PlanTabProps) {
  const router = useRouter();
  const createFromPlan = useMutation(api.features.createFromPlan);
  const updatePlan = useMutation(api.plans.update);
  const [isLoading, setIsLoading] = useState(false);

  const parsedSpec = (() => {
    if (!generatedSpec) return null;
    try {
      return parseSpec(generatedSpec);
    } catch {
      return null;
    }
  })();

  const isLocked = planState === "feature_created";

  const handleCreateFeature = async () => {
    if (!generatedSpec) return;
    setIsLoading(true);
    try {
      if (planState === "draft") {
        await updatePlan({ id: planId, generatedSpec, state: "finalized" });
      }
      const featureId = await createFromPlan({ planId });
      router.push(`/${repoSlug}/features/${featureId}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!parsedSpec) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mb-4">
          <IconMessageQuestion size={32} className="text-default-400" />
        </div>
        <h3 className="text-lg font-semibold text-default-700 mb-2">No Plan Generated Yet</h3>
        <p className="text-sm text-default-500 mb-6 max-w-md">
          Complete the interview in the Chat tab to generate a structured implementation plan.
        </p>
        <Button color="primary" onPress={onStartInterview}>
          Go to Chat
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <IconCircleCheck size={20} className="text-success" />
            <h2 className="text-xl font-bold">{parsedSpec.title}</h2>
          </div>
          <p className="text-default-500">{parsedSpec.description}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Tasks ({parsedSpec.tasks.length})</h3>
          <div className="space-y-2">
            {parsedSpec.tasks.map((task, i) => (
              <div
                key={i}
                className="p-3 bg-default-100 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-default-500 mt-1">{task.description}</p>
                    )}
                    {task.dependencies.length > 0 && (
                      <p className="text-xs text-default-400 mt-2">
                        Depends on: {task.dependencies.map((d) => `Task ${d}`).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {!isLocked && (
          <div className="flex gap-3 pt-4 border-t border-divider">
            <Button
              variant="flat"
              startContent={<IconMessageQuestion size={18} />}
              onPress={onStartInterview}
              isDisabled={isLoading}
            >
              Interview More
            </Button>
            <Button
              color="primary"
              startContent={<IconRocket size={18} />}
              onPress={handleCreateFeature}
              isLoading={isLoading}
            >
              Create Feature
            </Button>
          </div>
        )}
        {isLocked && (
          <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
            <p className="text-sm text-success-700 dark:text-success-400">
              Feature has been created from this plan. The plan is now locked.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
