"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useRouter } from "next/navigation";
import { parseSpec } from "@/lib/utils/parseSpec";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/modal";
import {
  IconRocket,
  IconMessageQuestion,
  IconCircleCheck,
  IconCode,
  IconFolderSearch,
  IconAlertCircle,
  IconArrowBack,
} from "@tabler/icons-react";
import { ProjectContextTab } from "./ProjectContextTab";
import { useRepo } from "@/lib/contexts/RepoContext";

type ProjectPhase = "draft" | "finalized" | "active" | "completed";

interface CodebaseIndex {
  summary: string;
  techStack: {
    language: string;
    framework: string;
    other: string[];
  };
  structure: {
    entryPoints: string[];
    keyDirectories: Array<{ path: string; purpose: string }>;
  };
  patterns: {
    componentPattern: string;
    stateManagement: string;
    apiPattern: string;
  };
  keyFiles: Array<{ path: string; purpose: string; exports: string[] }>;
  conventions: {
    naming: string;
    fileStructure: string;
    imports: string;
  };
}

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
  repoId,
  installationId,
  onRejectSpec,
}: ProjectPlanTabProps) {
  const { repo } = useRepo();
  const codebaseIndex = repo.codebaseIndex;
  const indexingStatus = repo.indexingStatus;
  const router = useRouter();
  const startDevelopment = useMutation(api.projects.startDevelopment);
  const updateProject = useMutation(api.projects.update);
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [showIndexModal, setShowIndexModal] = useState(false);
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

  const parsedIndex: CodebaseIndex | null = (() => {
    if (!codebaseIndex) return null;
    try {
      const parsed = JSON.parse(codebaseIndex);
      if (parsed.type === "result" && parsed.result) {
        const jsonMatch = parsed.result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return parsed;
    } catch {
      return null;
    }
  })();

  const isLocked = projectPhase === "active" || projectPhase === "completed";

  const handleIndexCodebase = async () => {
    setIsIndexing(true);
    setIndexError(null);
    try {
      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "project/index.requested",
          data: {
            repoId,
            installationId,
          },
        }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Indexing error:", errorMessage);
      setIndexError(errorMessage);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleStartDevelopment = async () => {
    if (!generatedSpec) return;
    setIsLoading(true);
    try {
      if (projectPhase === "draft") {
        await updateProject({ id: projectId, generatedSpec, phase: "finalized" });
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
        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mb-4">
          <IconMessageQuestion size={32} className="text-default-400" />
        </div>
        <h3 className="text-lg font-semibold text-default-700 mb-2">
          No Plan Generated Yet
        </h3>
        <p className="text-sm text-default-500 mb-6 max-w-md">
          Complete the interview in the Chat tab to generate a structured
          implementation plan.
        </p>
        <p className="text-sm text-default-400">
          The AI will generate a plan automatically during the interview.
        </p>
      </div>
    );
  }

  const showIndexButton = !codebaseIndex && indexingStatus !== "indexing";
  const isCurrentlyIndexing = indexingStatus === "indexing" || isIndexing;

  return (
    <div className="h-full overflow-y-auto scrollbar p-4">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <IconCircleCheck size={20} className="text-success" />
            <h2 className="text-xl font-bold">{parsedSpec.title}</h2>
          </div>
          <p className="text-default-500">{parsedSpec.description}</p>
        </div>

        {showIndexButton && (
          <Card shadow="none" className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
            <CardBody className="flex flex-row items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center flex-shrink-0">
                <IconFolderSearch size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary-700 dark:text-primary-300">
                  Index Codebase for Better Context
                </p>
                <p className="text-sm text-primary-600 dark:text-primary-400">
                  Analyze your codebase so the AI agent knows which files to modify
                </p>
              </div>
              <Button
                color="primary"
                startContent={<IconCode size={18} />}
                onPress={handleIndexCodebase}
                isLoading={isCurrentlyIndexing}
              >
                Index Now
              </Button>
            </CardBody>
          </Card>
        )}

        {isCurrentlyIndexing && (
          <Card shadow="none" className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
            <CardBody className="flex flex-row items-center gap-4">
              <Spinner size="sm" color="warning" />
              <div>
                <p className="font-medium text-warning-700 dark:text-warning-300">
                  Indexing Codebase...
                </p>
                <p className="text-sm text-warning-600 dark:text-warning-400">
                  This may take 1-2 minutes. Eva is analyzing your project structure.
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {(indexingStatus === "error" || indexError) && (
          <Card shadow="none" className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
            <CardBody className="space-y-3">
              <div className="flex items-start gap-3">
                <IconAlertCircle size={24} className="text-danger-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-danger-700 dark:text-danger-300">
                    Indexing Failed
                  </p>
                  <p className="text-sm text-danger-600 dark:text-danger-400">
                    There was an error analyzing the codebase. You can try again or proceed
                    without indexing.
                  </p>
                </div>
                <Button color="danger" variant="flat" size="sm" onPress={handleIndexCodebase}>
                  Retry
                </Button>
              </div>
              {indexError && (
                <div className="bg-danger-100 dark:bg-danger-900/40 p-3 rounded-lg">
                  <p className="text-xs font-mono text-danger-700 dark:text-danger-300 break-all">
                    {indexError}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {parsedIndex && (
          <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
            <div className="flex items-center gap-3 text-sm">
              <IconCode size={18} className="text-success-600" />
              <span className="text-success-700 dark:text-success-400">
                {parsedIndex.techStack?.language ?? "Unknown"} / {parsedIndex.techStack?.framework ?? "Unknown"}
              </span>
              <span className="text-success-600 dark:text-success-500">
                {parsedIndex.keyFiles?.length ?? 0} key files
              </span>
            </div>
            <Button
              variant="flat"
              size="sm"
              onPress={() => setShowIndexModal(true)}
            >
              View Index
            </Button>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-3">Tasks ({parsedSpec.tasks.length})</h3>
          <div className="space-y-1">
            {parsedSpec.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-default-100">
                <span className="text-default-400 font-mono text-sm w-6">{i + 1}.</span>
                <span className="text-sm flex-1">{task.title}</span>
                {task.dependencies.length > 0 && (
                  <span className="text-xs text-default-400">
                    after {task.dependencies.join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {!isLocked && (
          <div className="space-y-3 pt-4 border-t border-divider">
            {showRejectInput ? (
              <div className="flex gap-2">
                <Input
                  size="sm"
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
                />
                <Button
                  size="sm"
                  color="primary"
                  isDisabled={!rejectReason.trim()}
                  onPress={() => {
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
                  variant="flat"
                  startContent={<IconArrowBack size={18} />}
                  onPress={() => setShowRejectInput(true)}
                  isDisabled={isLoading}
                >
                  Keep Interviewing
                </Button>
                <Button
                  color="primary"
                  startContent={<IconRocket size={18} />}
                  onPress={handleStartDevelopment}
                  isLoading={isLoading}
                >
                  Accept Plan
                </Button>
              </div>
            )}
          </div>
        )}
        {isLocked && (
          <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
            <p className="text-sm text-success-700 dark:text-success-400">
              Development has started on this project. The plan is now locked.
            </p>
          </div>
        )}
      </div>
      <Modal
        isOpen={showIndexModal}
        onClose={() => setShowIndexModal(false)}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Codebase Index</ModalHeader>
          <ModalBody className="p-0">
            <ProjectContextTab />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
