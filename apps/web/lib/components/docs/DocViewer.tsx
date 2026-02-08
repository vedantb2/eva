"use client";

import type { FunctionReturnType } from "convex/server";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import {
  Button,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Spinner,
} from "@conductor/ui";
import {
  IconTrash,
  IconPlus,
  IconX,
  IconGripVertical,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRepo } from "@/lib/contexts/RepoContext";
import dayjs from "@/lib/dates";

type Doc = NonNullable<FunctionReturnType<typeof api.docs.get>>;

export function DocViewer({ doc }: { doc: Doc }) {
  return <DocEditor key={doc._id} doc={doc} />;
}

function DocEditor({ doc }: { doc: Doc }) {
  const router = useRouter();
  const { repoSlug } = useRepo();
  const updateDoc = useMutation(api.docs.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.docs.get, { id: args.id });
      if (current) {
        localStore.setQuery(
          api.docs.get,
          { id: args.id },
          {
            ...current,
            ...args,
            updatedAt: Date.now(),
          },
        );
      }
    },
  );
  const removeDoc = useMutation(api.docs.remove);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const addRequirement = () => {
    updateDoc({ id: doc._id, requirements: [...(doc.requirements ?? []), ""] });
  };

  const updateRequirement = (idx: number, val: string) => {
    const next = (doc.requirements ?? []).map((r, i) => (i === idx ? val : r));
    updateDoc({ id: doc._id, requirements: next });
  };

  const removeRequirement = (idx: number) => {
    const next = (doc.requirements ?? []).filter((_, i) => i !== idx);
    updateDoc({ id: doc._id, requirements: next });
  };

  const addFlow = () => {
    updateDoc({
      id: doc._id,
      userFlows: [...(doc.userFlows ?? []), { name: "", steps: [""] }],
    });
  };

  const removeFlow = (flowIdx: number) => {
    const next = (doc.userFlows ?? []).filter((_, i) => i !== flowIdx);
    updateDoc({ id: doc._id, userFlows: next });
  };

  const updateFlowName = (flowIdx: number, name: string) => {
    const next = (doc.userFlows ?? []).map((flow, i) =>
      i === flowIdx ? { ...flow, name } : flow,
    );
    updateDoc({ id: doc._id, userFlows: next });
  };

  const addStep = (flowIdx: number) => {
    const next = (doc.userFlows ?? []).map((flow, i) =>
      i === flowIdx ? { ...flow, steps: [...flow.steps, ""] } : flow,
    );
    updateDoc({ id: doc._id, userFlows: next });
  };

  const removeStep = (flowIdx: number, stepIdx: number) => {
    const next = (doc.userFlows ?? []).map((flow, i) =>
      i === flowIdx
        ? { ...flow, steps: flow.steps.filter((_, j) => j !== stepIdx) }
        : flow,
    );
    updateDoc({ id: doc._id, userFlows: next });
  };

  const updateStep = (flowIdx: number, stepIdx: number, val: string) => {
    const next = (doc.userFlows ?? []).map((flow, i) =>
      i === flowIdx
        ? {
            ...flow,
            steps: flow.steps.map((s, j) => (j === stepIdx ? val : s)),
          }
        : flow,
    );
    updateDoc({ id: doc._id, userFlows: next });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeDoc({ id: doc._id });
      setShowDeleteModal(false);
      router.push(`/${repoSlug}/docs`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Input
              value={doc.title}
              onChange={(e) =>
                updateDoc({ id: doc._id, title: e.target.value })
              }
              className="max-w-xs h-8 text-sm"
              placeholder="Document title"
            />
            <span className="text-xs text-neutral-400 whitespace-nowrap">
              {dayjs(doc.updatedAt).fromNow()}
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
          >
            <IconTrash size={16} />
            Delete
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar p-6 space-y-6">
          <section>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
              Description
            </label>
            <Textarea
              value={doc.description ?? ""}
              onChange={(e) =>
                updateDoc({ id: doc._id, description: e.target.value })
              }
              placeholder="What does this page or feature do?"
              rows={2}
              className="bg-white dark:bg-neutral-800"
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                Requirements
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconInfoCircle size={14} className="text-neutral-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Used for code-level testing and evaluation
                  </TooltipContent>
                </Tooltip>
              </label>
              <Button size="sm" variant="secondary" onClick={addRequirement}>
                <IconPlus size={14} />
                Add
              </Button>
            </div>
            {(doc.requirements ?? []).length === 0 ? (
              <p className="text-sm text-neutral-400">
                No requirements yet. Add items that should be verified during
                testing.
              </p>
            ) : (
              <div className="space-y-2">
                {(doc.requirements ?? []).map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <IconGripVertical
                      size={14}
                      className="text-neutral-300 dark:text-neutral-600 flex-shrink-0"
                    />
                    <Input
                      value={req}
                      onChange={(e) => updateRequirement(idx, e.target.value)}
                      placeholder="e.g. Users can log in with email"
                      className="h-8 text-sm bg-white dark:bg-neutral-800"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRequirement(idx)}
                      className="text-neutral-400 hover:text-red-500 flex-shrink-0 h-8 w-8"
                    >
                      <IconX size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                User Flows
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconInfoCircle size={14} className="text-neutral-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Used for UI testing in the testing arena
                  </TooltipContent>
                </Tooltip>
              </label>
              <Button size="sm" variant="secondary" onClick={addFlow}>
                <IconPlus size={14} />
                Add Flow
              </Button>
            </div>
            {(doc.userFlows ?? []).length === 0 ? (
              <p className="text-sm text-neutral-400">
                No user flows yet. Add step-by-step flows to test in the UI
                testing tab.
              </p>
            ) : (
              <div className="space-y-4">
                {(doc.userFlows ?? []).map((flow, flowIdx) => (
                  <div
                    key={flowIdx}
                    className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        value={flow.name}
                        onChange={(e) =>
                          updateFlowName(flowIdx, e.target.value)
                        }
                        placeholder={`Flow ${flowIdx + 1}`}
                        className="h-8 text-sm bg-white dark:bg-neutral-900"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFlow(flowIdx)}
                        className="text-neutral-400 hover:text-red-500 flex-shrink-0 h-8 w-8"
                      >
                        <IconX size={14} />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {flow.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 w-5 text-right flex-shrink-0 tabular-nums">
                            {stepIdx + 1}.
                          </span>
                          <Input
                            value={step}
                            onChange={(e) =>
                              updateStep(flowIdx, stepIdx, e.target.value)
                            }
                            placeholder="Describe this step"
                            className="h-8 text-sm bg-white dark:bg-neutral-900"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeStep(flowIdx, stepIdx)}
                            className="text-neutral-400 hover:text-red-500 flex-shrink-0 h-8 w-8"
                          >
                            <IconX size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addStep(flowIdx)}
                      className="mt-2 text-neutral-500"
                    >
                      <IconPlus size={14} />
                      Add Step
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog
        open={showDeleteModal}
        onOpenChange={(v) => {
          if (!v) setShowDeleteModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-foreground/80">
              Are you sure you want to delete <strong>{doc.title}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Spinner size="sm" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
