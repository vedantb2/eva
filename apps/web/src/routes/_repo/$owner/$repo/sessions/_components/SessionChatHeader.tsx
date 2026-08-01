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
} from "@eva/ui";
import {
  IconBrandVercel,
  IconDots,
  IconEye,
  IconGitPullRequest,
  IconPlayerPlay,
  IconPlayerStop,
  IconSparkles,
} from "@tabler/icons-react";
import type { Id } from "@eva/backend";
import { EntityContextUsage } from "@/lib/components/context-usage";
import { CopyLinkMenuItem } from "@/lib/components/CopyLinkButton";
import { SandboxPanelToggleButton } from "@/lib/components/sandbox/SandboxPanelToggleButton";
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
          className="motion-press text-status-code-review hover:scale-[1.01] active:scale-[0.96]"
          onClick={onOpenReviewModal}
        >
          <IconEye className="size-3" />
          <span className="hidden sm:inline">Send for Review</span>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label="More"
            className="motion-press hover:scale-[1.01] active:scale-[0.96]"
          >
            <IconDots className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onOpenSummaryModal}
            disabled={!isSandboxActive || messageCount === 0}
          >
            <IconSparkles className="size-3.5" />
            {hasSummary ? "Regenerate Summary" : "Summarise Session"}
          </DropdownMenuItem>
          {(deploymentStatus || prUrl) && <DropdownMenuSeparator />}
          {deploymentStatus && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem disabled>
                    <IconBrandVercel className="size-3.5" />
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
                className={`size-3.5 ${prStateIconClass(prState)}`}
              />
              View PR
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <CopyLinkMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
      {onToggleSandbox && (
        <SandboxPanelToggleButton
          collapsed={sandboxCollapsed === true}
          onToggle={onToggleSandbox}
        />
      )}
    </>
  );

  return { headerLeft, headerRight };
}
