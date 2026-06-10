"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { isDocViewerTab, type DocViewerTab } from "@/lib/search-params";
import {
  ActivitySteps,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  MessageResponse,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@conductor/ui";
import { ConfirmDeleteButton } from "./_components/ConfirmDeleteButton";
import {
  IconCheck,
  IconCopy,
  IconPencil,
  IconMessageChatbot,
  IconHistory,
  IconTestPipe,
  IconExternalLink,
  IconSettings,
  IconPlayerStop,
  IconX,
} from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";

import { DocInterviewDialog } from "./DocInterviewDialog";
import { FloatingToc } from "./FloatingToc";
import { MarkdownEditor } from "@/lib/components/editor/MarkdownEditor";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";

type Doc = NonNullable<FunctionReturnType<typeof api.docs.get>>;

export function DocViewer({
  doc,
  activeTab,
}: {
  doc: Doc;
  activeTab: DocViewerTab;
}) {
  return <DocEditor key={doc._id} doc={doc} activeTab={activeTab} />;
}

function DocEditor({ doc, activeTab }: { doc: Doc; activeTab: DocViewerTab }) {
  const navigate = useNavigate();
  const { basePath } = useRepo();
  const streaming = useQuery(api.streaming.get, { entityId: doc._id });
  const streamingSteps = parseActivitySteps(streaming?.currentActivity);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [testGenConfirmOpen, setTestGenConfirmOpen] = useState(false);
  const [isTriggeringTestGen, setIsTriggeringTestGen] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<string | null>(null);
  const [editKey, setEditKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const getMarkdownRef = useRef<() => string | null>(() => null);

  const handleDocTabChange = useCallback(
    (value: string) => {
      if (!isDocViewerTab(value)) return;
      navigate({
        to: `${basePath}/docs/${doc._id}/${value}`,
      });
    },
    [basePath, doc._id, navigate],
  );

  const startTestGenMutation = useMutation(api.testGenWorkflow.startTestGen);
  const cancelTestGenMutation = useMutation(api.testGenWorkflow.cancelTestGen);
  const startPrdParse = useMutation(api.docPrdWorkflow.startPrdParse);
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

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(doc.content);
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [doc.content]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleStartEdit = useCallback(() => {
    setEditingSnapshot(doc.content);
    setEditKey((k) => k + 1);
  }, [doc.content]);

  const handleCancelEdit = useCallback(() => {
    setEditingSnapshot(null);
  }, []);

  const handleEditorReady = useCallback((getMarkdown: () => string | null) => {
    getMarkdownRef.current = getMarkdown;
  }, []);

  const handleSave = useCallback(async () => {
    const markdown = getMarkdownRef.current();
    if (markdown === null) return;
    setIsSaving(true);
    try {
      await updateDoc({ id: doc._id, content: markdown });
      if (markdown.trim().length > 0) {
        await startPrdParse({ docId: doc._id });
      }
      setEditingSnapshot(null);
    } finally {
      setIsSaving(false);
    }
  }, [doc._id, updateDoc, startPrdParse]);

  const handleGenerateTests = async () => {
    if (isTriggeringTestGen || doc.testGenStatus === "running") return;
    setIsTriggeringTestGen(true);
    try {
      await startTestGenMutation({
        docId: doc._id,
      });
    } finally {
      setIsTriggeringTestGen(false);
    }
  };

  const handleStopTestGen = async () => {
    setIsStopping(true);
    try {
      await cancelTestGenMutation({ docId: doc._id });
    } finally {
      setIsStopping(false);
    }
  };

  const isGeneratingTests =
    doc.testGenStatus === "running" || isTriggeringTestGen;

  const isEditing = editingSnapshot !== null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <input
          value={doc.title}
          onChange={(e) => updateDoc({ id: doc._id, title: e.target.value })}
          className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 min-w-0 w-auto cursor-text placeholder:text-muted-foreground"
          placeholder="Document title"
          size={Math.max(doc.title.length, 12)}
        />
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {isGeneratingTests && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Spinner size="sm" />
              <span className="hidden sm:inline">Generating...</span>
            </div>
          )}
          <RelativeDateTime
            at={doc.updatedAt}
            className="text-xs text-muted-foreground whitespace-nowrap"
          />
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy content"}
          >
            {copied ? (
              <IconCheck className="size-4 text-success" />
            ) : (
              <IconCopy className="size-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="motion-press hover:scale-[1.01] active:scale-[0.96]"
              >
                <IconSettings size={16} />
                <span className="hidden sm:inline">Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setInterviewOpen(true)}>
                <IconMessageChatbot size={16} />
                Interview Me
              </DropdownMenuItem>
              {doc.testGenStatus === "completed" && doc.testPrUrl ? (
                <DropdownMenuItem asChild>
                  <a
                    href={doc.testPrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconExternalLink size={16} />
                    View Tests PR
                  </a>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setTestGenConfirmOpen(true)}
                  disabled={isGeneratingTests}
                >
                  <IconTestPipe size={16} />
                  Generate Tests
                </DropdownMenuItem>
              )}
              {(doc.interviewHistory ?? []).length > 0 && (
                <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                  <IconHistory size={16} />
                  View History
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <DocInterviewDialog
        doc={doc}
        open={interviewOpen}
        onOpenChange={setInterviewOpen}
      />
      <DocInterviewDialog
        doc={doc}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        readOnly
      />
      <Dialog open={testGenConfirmOpen} onOpenChange={setTestGenConfirmOpen}>
        <DialogContent hideCloseButton className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate Tests?</DialogTitle>
            <DialogDescription>
              This will generate tests based on the current requirements and
              user flows extracted from the PRD.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              onClick={() => {
                setTestGenConfirmOpen(false);
                handleGenerateTests();
              }}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {streaming && (
        <div className="px-4 pb-3">
          <div className="rounded-surface border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Spinner size="sm" />
              <span className="flex-1">
                {isGeneratingTests
                  ? "Generating tests..."
                  : "Processing PRD..."}
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleStopTestGen}
                disabled={isStopping}
              >
                {isStopping ? (
                  <Spinner size="sm" />
                ) : (
                  <IconPlayerStop size={14} />
                )}
                Stop
              </Button>
            </div>
            {streamingSteps ? (
              <ActivitySteps steps={streamingSteps} isStreaming />
            ) : (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {streaming.currentActivity}
              </p>
            )}
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleDocTabChange}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 sm:px-4">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="requirements">
              Requirements
              <span className="ml-1.5 text-muted-foreground">
                {doc.requirements?.length ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="user-flows">
              User Flows
              <span className="ml-1.5 text-muted-foreground">
                {doc.userFlows?.length ?? 0}
              </span>
            </TabsTrigger>
          </TabsList>
          {activeTab === "content" ? (
            isEditing ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isSaving}
                  onClick={handleCancelEdit}
                >
                  <IconX size={14} />
                  Cancel
                </Button>
                <Button size="sm" disabled={isSaving} onClick={handleSave}>
                  <IconCheck size={14} />
                  Save
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={handleStartEdit}>
                <IconPencil size={14} />
                Edit
              </Button>
            )
          ) : null}
        </div>

        <TabsContent
          value="description"
          className="mt-3 min-h-0 flex-1 overflow-hidden px-3 pb-4 sm:px-4"
        >
          <Textarea
            value={doc.description ?? ""}
            onChange={(e) =>
              updateDoc({ id: doc._id, description: e.target.value })
            }
            placeholder="A short summary of this PRD."
            rows={6}
            className="scrollbar bg-card"
          />
        </TabsContent>

        <TabsContent
          value="content"
          className="mt-3 min-h-0 flex-1 overflow-hidden px-3 pb-4 sm:px-4 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {editingSnapshot !== null ? (
              <MarkdownEditor
                key={editKey}
                initialMarkdown={editingSnapshot}
                onEditorReady={handleEditorReady}
              />
            ) : (
              <div className="flex min-h-0 flex-1 gap-6 overflow-hidden">
                <div
                  ref={contentScrollRef}
                  className="scrollbar min-h-0 flex-1 overflow-y-auto"
                >
                  {doc.content.trim().length > 0 ? (
                    <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                      {doc.content}
                    </MessageResponse>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No content yet. Click Edit to add product requirements.
                    </p>
                  )}
                </div>
                {doc.content.trim().length > 0 ? (
                  <FloatingToc
                    containerRef={contentScrollRef}
                    content={doc.content}
                    className="hidden w-52 shrink-0 py-1 lg:block"
                  />
                ) : null}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="requirements"
          className="scrollbar mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4 sm:px-4"
        >
          {(doc.requirements?.length ?? 0) > 0 ? (
            <ul className="list-disc space-y-2 pl-5">
              {(doc.requirements ?? []).map((req, i) => (
                <li key={i} className="text-sm">
                  {req}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No requirements extracted yet. They are populated automatically
              when you save the PRD content.
            </p>
          )}
        </TabsContent>

        <TabsContent
          value="user-flows"
          className="scrollbar mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4 sm:px-4"
        >
          {(doc.userFlows?.length ?? 0) > 0 ? (
            <div className="space-y-4">
              {(doc.userFlows ?? []).map((flow, i) => (
                <div
                  key={i}
                  className="rounded-surface border border-border bg-card p-3 sm:p-4"
                >
                  <p className="text-sm font-medium">{flow.name}</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    {flow.steps.map((step, j) => (
                      <li key={j} className="text-sm text-muted-foreground">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No user flows extracted yet. They are populated automatically when
              you save the PRD content.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
