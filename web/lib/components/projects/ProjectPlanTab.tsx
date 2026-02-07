"use client";

import { useState } from "react";
import { Button, Input } from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "conductor-backend";
import type { Id } from "conductor-backend";
import { useRouter } from "next/navigation";
import { parseSpec } from "@/lib/utils/parseSpec";
import {
  IconRocket,
  IconMessageQuestion,
  IconCircleCheck,
  IconArrowBack,
} from "@tabler/icons-react";
import type { ProjectPhase } from "@/lib/components/projects/ProjectPhaseBadge";

interface ProjectPlanTabProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  generatedSpec: string | undefined;
  repoSlug: string;
  repoId: Id<"githubRepos">;
  installationId: number;
  onRejectSpec: (reason: string) => void;
}

export function ProjectPlanTab({
  projectId,
  projectPhase,
  generatedSpec,
  repoSlug,
  onRejectSpec,
}: ProjectPlanTabProps) {
  const router = useRouter();
  const startDevelopment = useMutation(api.projects.startDevelopment);
  const updateProject = useMutation(api.projects.update);
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const parsedSpec = (() => {
    if (!generatedSpec) return null;
    try {
      return parseSpec(generatedSpec);
    } catch {
      return null;
    }
  })();

  const isLocked = projectPhase === "active" || projectPhase === "completed";

  const handleStartDevelopment = async () => {
    if (!generatedSpec) return;
    setIsLoading(true);
    try {
      if (projectPhase === "draft") {
        await updateProject({
          id: projectId,
          generatedSpec,
          phase: "finalized",
        });
      }
      await startDevelopment({ projectId });
      router.push(`/${repoSlug}/projects/${projectId}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!parsedSpec) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <IconMessageQuestion size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Plan Generated Yet
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Complete the interview in the Chat tab to generate a structured
          implementation plan.
        </p>
        <p className="text-sm text-muted-foreground">
          Eva will generate a plan automatically during the interview.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar p-4">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <IconCircleCheck
              size={20}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <h2 className="text-xl font-bold">{parsedSpec.title}</h2>
          </div>
          <p className="text-muted-foreground">{parsedSpec.description}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">
            Tasks ({parsedSpec.tasks.length})
          </h3>
          <div className="space-y-1">
            {parsedSpec.tasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted"
              >
                <span className="text-muted-foreground font-mono text-sm w-6">
                  {i + 1}.
                </span>
                <span className="text-sm flex-1">{task.title}</span>
                {task.dependencies.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    after {task.dependencies.join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {!isLocked && (
          <div className="space-y-3 pt-4 border-t border-border">
            {showRejectInput ? (
              <div className="flex gap-2">
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="What's missing from this plan?"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && rejectReason.trim()) {
                      onRejectSpec(rejectReason.trim());
                      setRejectReason("");
                      setShowRejectInput(false);
                    }
                  }}
                  autoFocus
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  disabled={!rejectReason.trim()}
                  onClick={() => {
                    onRejectSpec(rejectReason.trim());
                    setRejectReason("");
                    setShowRejectInput(false);
                  }}
                >
                  Submit
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectInput(true)}
                  disabled={isLoading}
                >
                  <IconArrowBack size={18} />
                  Keep Interviewing
                </Button>
                <Button onClick={handleStartDevelopment} disabled={isLoading}>
                  <IconRocket size={18} />
                  {isLoading ? "Starting..." : "Accept Plan"}
                </Button>
              </div>
            )}
          </div>
        )}
        {isLocked && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Development has started on this project. The plan is now locked.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
