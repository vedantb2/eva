"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction } from "convex/react";
import { api, type Id } from "@eva/backend";
import { parseActivitySteps } from "@eva/shared/parseActivitySteps";
import {
  ActivityTasks,
  Button,
  EmptyState,
  Spinner,
  Surface,
  Tabs,
  TabsBar,
  TabsList,
  TabsTrigger,
} from "@eva/ui";
import {
  IconAlertTriangle,
  IconExternalLink,
  IconGitPullRequest,
  IconRefresh,
} from "@tabler/icons-react";
import { Streamdown } from "streamdown";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { HtmlPreviewFrame } from "@/lib/components/docs/_components/HtmlPreviewFrame";
import { useRepo } from "@/lib/contexts/RepoContext";
import { entityPathSegment } from "@/lib/numId";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

type RecapDoc = FunctionReturnType<typeof api.docs.getRecapByPrUrl>;

interface PrRecapPanelProps {
  prUrl?: string;
  repoId: Id<"githubRepos">;
  recapDoc: RecapDoc | undefined;
}

/**
 * Recap sub-tab for the sandbox PR panel — generate/stream/ready states for
 * Eva-origin (and any) PR recaps keyed by prUrl.
 */
export function PrRecapPanel({ prUrl, repoId, recapDoc }: PrRecapPanelProps) {
  const { basePath } = useRepo();
  const generatePrRecap = useAction(api.docs.generatePrRecap);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [view, setView] = useState<"recap" | "summary">("recap");

  const streamingEntityId =
    recapDoc !== null && recapDoc !== undefined
      ? `pr-recap:${recapDoc._id}`
      : "";
  const streaming = useQuery(
    api.streaming.get,
    streamingEntityId ? { entityId: streamingEntityId } : "skip",
  );
  const streamingSteps = parseActivitySteps(streaming?.currentActivity);

  const handleGenerate = async () => {
    if (!prUrl) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      await generatePrRecap({ repoId, prUrl });
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : "Couldn't generate recap",
      );
    }
    setIsGenerating(false);
  };

  if (!prUrl) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <EmptyState
          icon={<IconGitPullRequest />}
          title="No pull request yet"
          description="Once a pull request is opened for this work, its recap will appear here."
        />
      </div>
    );
  }

  if (recapDoc === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="sm" />
      </div>
    );
  }

  if (recapDoc === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <EmptyState
          icon={<IconGitPullRequest />}
          title="No recap yet"
          description="Generate a recap of this pull request for reviewers."
          action={
            <Button
              size="sm"
              onClick={() => {
                void handleGenerate();
              }}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" />
                  Generating…
                </>
              ) : (
                "Generate recap"
              )}
            </Button>
          }
        />
        {generateError ? (
          <p className="mt-2 text-sm text-destructive">{generateError}</p>
        ) : null}
      </div>
    );
  }

  const isPending = recapDoc.prRecapStatus === "pending";
  const isErrored = recapDoc.prRecapStatus === "error";
  const docPath = entityPathSegment(recapDoc);
  const shortSha =
    recapDoc.headSha !== undefined ? recapDoc.headSha.slice(0, 7) : null;

  return (
    <Tabs
      value={view}
      onValueChange={(value) => {
        if (value === "recap" || value === "summary") setView(value);
      }}
      className="flex h-full min-h-0 flex-col"
    >
      <TabsBar
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {shortSha ? <span className="font-mono">{shortSha}</span> : null}
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              View on GitHub
              <IconExternalLink size={12} />
            </a>
            {recapDoc.prNumber !== undefined ? (
              <DynamicLink
                to={toInternalRepoHref(
                  `${basePath}/reviews/${recapDoc.prNumber}/recap`,
                )}
                className="hover:text-foreground"
              >
                Open in Reviews
              </DynamicLink>
            ) : docPath ? (
              <DynamicLink
                to={toInternalRepoHref(`${basePath}/docs/${docPath}/recap`)}
                className="hover:text-foreground"
              >
                Open in Documents
              </DynamicLink>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => {
                void handleGenerate();
              }}
              disabled={isGenerating || isPending}
            >
              {isGenerating ? <Spinner size="sm" /> : <IconRefresh size={14} />}
              {recapDoc.prRecapStatus === "ready" ? "Regenerate" : "Generate"}
            </Button>
          </div>
        }
      >
        <TabsList>
          <TabsTrigger value="recap">Recap</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
      </TabsBar>

      {isErrored ? (
        <div className="flex items-start gap-2 border-b border-border bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Recap failed</p>
            <p className="text-destructive/80">
              {recapDoc.prRecapError ??
                "Something went wrong generating the recap."}
            </p>
          </div>
        </div>
      ) : null}

      {(streaming || isPending) && (
        <div className="shrink-0 px-3 py-2">
          <Surface density="tight" className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Spinner size="sm" />
              <span className="flex-1">Generating recap...</span>
            </div>
            {streamingSteps ? (
              <ActivityTasks steps={streamingSteps} isStreaming />
            ) : (
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                {streaming?.currentActivity ?? "Generating recap..."}
              </p>
            )}
          </Surface>
        </div>
      )}

      {generateError ? (
        <p className="px-3 py-1 text-sm text-destructive">{generateError}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        {view === "recap" ? (
          recapDoc.html ? (
            <HtmlPreviewFrame html={recapDoc.html} title="PR recap" />
          ) : (
            <p className="text-sm text-muted-foreground">
              No recap yet. It is created the next time this review runs.
            </p>
          )
        ) : (
          <Surface>
            <Streamdown className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {recapDoc.content}
            </Streamdown>
          </Surface>
        )}
      </div>
    </Tabs>
  );
}
