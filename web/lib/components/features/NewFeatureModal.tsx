"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useAction, useMutation } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { Button } from "@/lib/components/ui/Button";
import { IconSparkles, IconCheck, IconAlertCircle } from "@tabler/icons-react";

interface NewFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: Id<"columns">;
}

type Step = "input" | "generating" | "review" | "error";

interface GeneratedSpec {
  title: string;
  description: string;
  subtasks: string[];
}

export function NewFeatureModal({
  isOpen,
  onClose,
  columnId,
}: NewFeatureModalProps) {
  const generateSpec = useAction(api.specs.generateSpec);
  const createTask = useMutation(api.agentTasks.create);
  const createSubtask = useMutation(api.subtasks.create);

  const [step, setStep] = useState<Step>("input");
  const [description, setDescription] = useState("");
  const [spec, setSpec] = useState<GeneratedSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setStep("generating");
    setError(null);

    try {
      const result = await generateSpec({ description: description.trim() });
      setSpec(result);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate spec");
      setStep("error");
    }
  };

  const handleCreate = async () => {
    if (!spec) return;
    setIsCreating(true);

    try {
      const taskId = await createTask({
        columnId,
        title: spec.title,
        description: spec.description,
      });

      for (const subtask of spec.subtasks) {
        await createSubtask({
          parentTaskId: taskId,
          title: subtask,
        });
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      setStep("error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep("input");
    setDescription("");
    setSpec(null);
    setError(null);
    onClose();
  };

  const handleBack = () => {
    setStep("input");
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      size="2xl"
      placement="center"
      classNames={{ backdrop: "bg-black/50" }}
    >
      <ModalContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
        <ModalHeader className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <IconSparkles className="w-5 h-5 text-pink-600" />
          New Feature
        </ModalHeader>

        <ModalBody>
          {step === "input" && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Describe the feature you want to build. AI will generate a detailed spec with subtasks.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Add user authentication with email/password login, social sign-in options, and password reset functionality..."
                className="w-full px-4 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                rows={5}
                autoFocus
              />
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600" />
                <IconSparkles className="absolute inset-0 m-auto w-5 h-5 text-pink-600" />
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Generating feature spec...
              </p>
            </div>
          )}

          {step === "review" && spec && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Title
                </label>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
                  {spec.title}
                </h3>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Description
                </label>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                  {spec.description}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Subtasks ({spec.subtasks.length})
                </label>
                <ul className="mt-2 space-y-2">
                  {spec.subtasks.map((subtask, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 text-xs flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      {subtask}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <IconAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Something went wrong
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {error}
                </p>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="border-t border-neutral-200 dark:border-neutral-700">
          {step === "input" && (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={!description.trim()}>
                <IconSparkles size={16} className="mr-1" />
                Generate Spec
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                <IconCheck size={16} className="mr-1" />
                {isCreating ? "Creating..." : "Create Task"}
              </Button>
            </>
          )}

          {step === "error" && (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleBack}>Try Again</Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
