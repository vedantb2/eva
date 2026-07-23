"use client";

import { useState, useEffect, useRef } from "react";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import type { OptimisticLocalStore } from "convex/browser";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@conductor/backend";
import { entityPathSegment } from "@/lib/numId";
import { useRepo } from "@/lib/contexts/RepoContext";
import { isDocViewerTab, type DocViewerTab } from "@/lib/search-params";
import {
  ActivityTasks,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@conductor/ui";
import {
  IconCheck,
  IconCopy,
  IconMessageChatbot,
  IconTestPipe,
  IconExternalLink,
  IconSettings,
  IconPlayerStop,
  IconMessage,
  IconHistory,
  IconPencilCheck,
} from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { DocInterviewDialog } from "../DocInterviewDialog";
import { DocContentTab } from "./DocContentTab";
import { HtmlPreviewFrame } from "./HtmlPreviewFrame";
import { DocModeSwitcher } from "./DocModeSwitcher";
import { DocPresenceFacepile } from "./DocPresenceFacepile";
import { DocTestGenDialog } from "./DocTestGenDialog";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";

type Doc = NonNullable<FunctionReturnType<typeof api.docs.get>>;

function applyDocUpdateOptimistically(
  localStore: OptimisticLocalStore,
  args: FunctionArgs<typeof api.docs.update>,
) {
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
}

export function DocPrdViewer({
  doc,
  activeTab,
}: {
  doc: Doc;
  activeTab: DocViewerTab;
}) {
  const navigate = useNavigate();
  const { basePath } = useRepo();
  const streaming = useQuery(api.streaming.get, { entityId: doc._id });
  const streamingSteps = parseActivitySteps(streaming?.currentActivity);
  const docComments =
    useQuery(api.docComments.listByDoc, { docId: doc._id }) ?? [];
  const openCommentCount = docComments.filter(
    (c) => !c.parentId && c.resolvedAt === undefined,
  ).length;
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [testGenConfirmOpen, setTestGenConfirmOpen] = useState(false);
  const [isTriggeringTestGen, setIsTriggeringTestGen] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionCount, setSuggestionCount] = useState(0);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleComments = () => {
    setCommentsOpen((v) => !v);
    setHistoryPanelOpen(false);
    setSuggestionsOpen(false);
  };
  const toggleHistory = () => {
    setHistoryPanelOpen((v) => !v);
    setCommentsOpen(false);
    setSuggestionsOpen(false);
  };
  const toggleSuggestions = () => {
    setSuggestionsOpen((v) => !v);
    setCommentsOpen(false);
    setHistoryPanelOpen(false);
  };

  const handleDocTabChange = (value: string) => {
    if (!isDocViewerTab(value)) return;
    navigate({
      to: `${basePath}/docs/${entityPathSegment(doc) ?? ""}/${value}`,
      search: (prev) => prev,
    });
  };

  const startTestGenMutation = useMutation(api.testGenWorkflow.startTestGen);
  const cancelTestGenMutation = useMutation(api.testGenWorkflow.cancelTestGen);
  const updateDoc = useMutation(api.docs.update).withOptimisticUpdate(
    applyDocUpdateOptimistically,
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(doc.content);
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleGenerateTests = async () => {
    if (isTriggeringTestGen || doc.testGenStatus === "running") return;
    setIsTriggeringTestGen(true);
    try {
      await startTestGenMutation({ docId: doc._id });
    } catch (error) {
      setIsTriggeringTestGen(false);
      throw error;
    }
    setIsTriggeringTestGen(false);
  };

  const handleStopTestGen = async () => {
    setIsStopping(true);
    try {
      await cancelTestGenMutation({ docId: doc._id });
    } catch (error) {
      setIsStopping(false);
      throw error;
    }
    setIsStopping(false);
  };

  const isGeneratingTests =
    doc.testGenStatus === "running" || isTriggeringTestGen;

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
          <DocPresenceFacepile docId={doc._id} />
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
          <DocModeSwitcher />
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
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleCopy();
                }}
              >
                {copied ? (
                  <IconCheck size={16} className="text-success" />
                ) : (
                  <IconCopy size={16} />
                )}
                Copy PRD
              </DropdownMenuItem>
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
              <DropdownMenuItem onClick={toggleHistory}>
                <IconHistory size={16} />
                Version History
              </DropdownMenuItem>
              {(doc.interviewHistory ?? []).length > 0 && (
                <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                  <IconHistory size={16} />
                  Interview History
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
      <DocTestGenDialog
        open={testGenConfirmOpen}
        onOpenChange={setTestGenConfirmOpen}
        onConfirm={handleGenerateTests}
      />
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
              <ActivityTasks steps={streamingSteps} isStreaming />
            ) : null}
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
            <TabsTrigger value="content">Markdown</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1">
            {activeTab === "content" && (
              <>
                <Button
                  size="sm"
                  variant={suggestionsOpen ? "secondary" : "ghost"}
                  className="h-7 px-2"
                  onClick={toggleSuggestions}
                >
                  <IconPencilCheck size={14} />
                  <span className="text-xs">Suggestions</span>
                  {suggestionCount > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {suggestionCount}
                    </span>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={commentsOpen ? "secondary" : "ghost"}
                  className="h-7 px-2"
                  onClick={toggleComments}
                >
                  <IconMessage size={14} />
                  <span className="text-xs">Comments</span>
                  {openCommentCount > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {openCommentCount}
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent
          value="content"
          className="mt-3 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
        >
          <DocContentTab
            doc={doc}
            commentsOpen={commentsOpen}
            onToggleComments={toggleComments}
            historyOpen={historyPanelOpen}
            onToggleHistory={toggleHistory}
            suggestionsOpen={suggestionsOpen}
            onToggleSuggestions={toggleSuggestions}
            onSuggestionCount={setSuggestionCount}
          />
        </TabsContent>

        <TabsContent
          value="html"
          className="mt-3 min-h-0 flex-1 overflow-hidden px-3 pb-4 sm:px-4"
        >
          {doc.html ? (
            <HtmlPreviewFrame html={doc.html} title="HTML preview" />
          ) : (
            <p className="text-sm text-muted-foreground">
              No HTML for this document yet.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
