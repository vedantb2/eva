"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  Button,
  Spinner,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useNavigate } from "@tanstack/react-router";
import { parseSpec } from "@/lib/utils/parseSpec";
import { IconFileText, IconRocket, IconCircleCheck } from "@tabler/icons-react";

interface ProjectFinalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  spec: string;
  basePath: string;
}

export function ProjectFinalizationModal({
  isOpen,
  onClose,
  projectId,
  spec,
  basePath,
}: ProjectFinalizationModalProps) {
  const navigate = useNavigate();
  const updateProject = useMutation(api.projects.update);
  const startDevelopment = useMutation(api.projects.startDevelopment);
  const [isLoading, setIsLoading] = useState(false);

  const parsedSpec = (() => {
    try {
      return parseSpec(spec);
    } catch {
      return null;
    }
  })();

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      await updateProject({
        id: projectId,
        generatedSpec: spec,
        phase: "finalized",
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDevelopment = async () => {
    setIsLoading(true);
    try {
      await updateProject({
        id: projectId,
        generatedSpec: spec,
        phase: "finalized",
      });
      await startDevelopment({ projectId });
      navigate({ to: `${basePath}/projects/${projectId}` });
    } finally {
      setIsLoading(false);
    }
  };

  if (!parsedSpec) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex flex-col gap-1">
          <DialogTitle>
            <span className="flex items-center gap-2 text-sm sm:text-base">
              <IconCircleCheck
                size={20}
                className="text-success flex-shrink-0"
              />
              Plan Generated
            </span>
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">
                {parsedSpec.title}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {parsedSpec.description}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm sm:text-base">
                Tasks ({parsedSpec.tasks.length})
              </h4>
              <ul className="space-y-2">
                {parsedSpec.tasks.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs sm:text-sm bg-muted p-2 rounded"
                  >
                    <span className="text-muted-foreground font-mono flex-shrink-0">
                      {i + 1}.
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium">{task.title}</span>
                      {task.dependencies.length > 0 && (
                        <span className="text-muted-foreground ml-1 sm:ml-2 block sm:inline">
                          (depends on: {task.dependencies.join(", ")})
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <IconFileText size={16} />
            Save as Draft
          </Button>
          <Button
            onClick={handleStartDevelopment}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? <Spinner size="sm" /> : <IconRocket size={16} />}
            Start Development
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
