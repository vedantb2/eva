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
  IconExternalLink,
  IconSettings,
  IconMessage,
  IconHistory,
  IconPencilCheck,
} from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { DocContentTab } from "./DocContentTab";
import { DocPresenceFacepile } from "./DocPresenceFacepile";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";

type Doc = NonNullable<FunctionReturnType<typeof api.docs.get>>;

export function DocRecapViewer({
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
  const [copied, setCopied] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionCount, setSuggestionCount] = useState(0);
  const [isRevising, setIsRevising] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reviseRecap = useMutation(api.docs.reviseRecapFromFeedback);

  const pendingAgentFeedbackCount = doc.pendingAgentCommentIds?.length ?? 0;
  const canReviseRecap =
    pendingAgentFeedbackCount > 0 &&
    !doc.activeWorkflowId &&
    doc.prRecapStatus !== "pending";

  const toggleComments = useCallback(() => {
    setCommentsOpen((v) => !v);
    setHistoryPanelOpen(false);
    setSuggestionsOpen(false);
  }, []);
  const toggleHistory = useCallback(() => {
    setHistoryPanelOpen((v) => !v);
    setCommentsOpen(false);
    setSuggestionsOpen(false);
  }, []);
  const toggleSuggestions = useCallback(() => {
    setSuggestionsOpen((v) => !v);
    setCommentsOpen(false);
    setHistoryPanelOpen(false);
  }, []);

  const handleDocTabChange = useCallback(
    (value: string) => {
      if (!isDocViewerTab(value)) return;
      navigate({
        to: `${basePath}/docs/${doc._id}/${value}`,
        search: (prev) => prev,
      });
    },
    [basePath, doc._id, navigate],
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

  const isRecapPending = doc.prRecapStatus === "pending";
  const isRecapErrored = doc.prRecapStatus === "error";

  const handleReviseRecap = useCallback(async () => {
    setIsRevising(true);
    try {
      await reviseRecap({ docId: doc._id });
    } finally {
      setIsRevising(false);
    }
  }, [doc._id, reviseRecap]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <h1 className="text-lg font-semibold min-w-0 truncate">{doc.title}</h1>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <DocPresenceFacepile docId={doc._id} />
          <RelativeDateTime
            at={doc.updatedAt}
            className="text-xs text-muted-foreground whitespace-nowrap"
          />
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
                Copy recap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleHistory}>
                <IconHistory size={16} />
                Version History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {doc.prUrl || doc.headSha ? (
        <div className="mx-3 mb-2 rounded-surface border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground sm:mx-4">
          <span>Auto-generated recap</span>
          {doc.headSha ? (
            <span className="ml-2 font-mono">{doc.headSha.slice(0, 7)}</span>
          ) : null}
          {doc.prUrl ? (
            <a
              href={doc.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 text-foreground hover:underline"
            >
              View on GitHub
              <IconExternalLink size={12} />
            </a>
          ) : null}
          {isRecapErrored && doc.prRecapError ? (
            <p className="mt-1 text-destructive">{doc.prRecapError}</p>
          ) : null}
          {canReviseRecap ? (
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-7"
                disabled={isRevising}
                onClick={handleReviseRecap}
              >
                {isRevising ? (
                  <>
                    <Spinner size="sm" />
                    Revising…
                  </>
                ) : (
                  `Revise recap (${pendingAgentFeedbackCount})`
                )}
              </Button>
              <span className="text-muted-foreground">
                Queued Ask Eva feedback
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
      {(streaming || isRecapPending) && (
        <div className="px-4 pb-3">
          <div className="rounded-surface border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Spinner size="sm" />
              <span className="flex-1">Generating recap...</span>
            </div>
            {streamingSteps ? (
              <ActivitySteps steps={streamingSteps} isStreaming />
            ) : (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {streaming?.currentActivity ?? "Generating recap..."}
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
            <TabsTrigger value="content">Content</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
