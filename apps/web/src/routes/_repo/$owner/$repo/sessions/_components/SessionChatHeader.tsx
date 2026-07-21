"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@conductor/ui";
import {
  IconBrandVercel,
  IconDots,
  IconGitPullRequest,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconPlayerPlay,
  IconPlayerStop,
  IconSend,
  IconSparkles,
} from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import { EntityContextUsage } from "@/lib/components/context-usage";
import { CopyLinkMenuItem } from "@/lib/components/CopyLinkButton";
import { prStateIconClass } from "../_utils/-prStateIconClass";

interface SessionChatHeaderProps {
  repoId: Id<"githubRepos">;
  sessionId: Id<"sessions">;
  branchName?: string;
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
  hasSummary: boolean;
  messageCount: number;
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  deploymentStatus?: "queued" | "building" | "deployed" | "error";
  sandboxCollapsed?: boolean;
  onSandboxToggle: (action: "start" | "stop") => void;
  onToggleSandbox?: () => void;
  onOpenSummaryModal: () => void;
  onOpenReviewModal: () => void;
}

export function SessionChatHeader({
  repoId,
  sessionId,
  branchName,
  prUrl,
  prState,
  hasSummary,
  messageCount,
  isSandboxActive,
  isSandboxToggling,
  deploymentStatus,
  sandboxCollapsed,
  onSandboxToggle,
  onToggleSandbox,
  onOpenSummaryModal,
  onOpenReviewModal,
}: SessionChatHeaderProps) {
  const headerLeft = (
    <Button
      size="icon"
      variant={isSandboxActive ? "destructive" : "secondary"}
      onClick={() => onSandboxToggle(isSandboxActive ? "stop" : "start")}
      disabled={isSandboxToggling}
      className={`motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.96] ${isSandboxActive ? "" : "text-success"}`}
    >
      {isSandboxToggling ? (
        <Spinner size="sm" />
      ) : isSandboxActive ? (
        <IconPlayerStop className="w-4 h-4" />
      ) : (
        <IconPlayerPlay className="w-4 h-4" />
      )}
    </Button>
  );

  const headerRight = (
    <>
      <EntityContextUsage repoId={repoId} entityId={sessionId} />
      {branchName && (!prState || prState === "draft") && (
        <Button
          size="sm"
          variant="secondary"
          className="motion-press text-success hover:scale-[1.01] active:scale-[0.96]"
          onClick={onOpenReviewModal}
        >
          <IconSend size={12} />
          <span className="hidden sm:inline">Send for Review</span>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            className="motion-press hover:scale-[1.01] active:scale-[0.96]"
          >
            More
            <IconDots size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onOpenSummaryModal}
            disabled={!isSandboxActive || messageCount === 0}
          >
            <IconSparkles size={14} />
            {hasSummary ? "Regenerate Summary" : "Summarise Session"}
          </DropdownMenuItem>
          {(deploymentStatus || prUrl) && <DropdownMenuSeparator />}
          {deploymentStatus && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem disabled>
                    <IconBrandVercel size={14} />
                    View Preview
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Please start sandbox and view changes through the preview tab
                there instead
              </TooltipContent>
            </Tooltip>
          )}
          {prUrl && (
            <DropdownMenuItem
              onClick={() => {
                window.open(prUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <IconGitPullRequest
                size={14}
                className={prStateIconClass(prState)}
              />
              View PR
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <CopyLinkMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
      {onToggleSandbox && (
        <Button
          size="icon"
          variant="ghost"
          className="size-8 motion-press hover:scale-[1.03] active:scale-[0.96]"
          onClick={onToggleSandbox}
          title={sandboxCollapsed ? "Show sandbox panel" : "Hide sandbox panel"}
        >
          {sandboxCollapsed ? (
            <IconLayoutSidebarRightExpand className="size-4" />
          ) : (
            <IconLayoutSidebarRightCollapse className="size-4" />
          )}
        </Button>
      )}
    </>
  );

  return { headerLeft, headerRight };
}
