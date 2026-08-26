"use client";

import type { ReactNode } from "react";
import { BackgroundAgentsChip } from "@/lib/components/chat/BackgroundAgentsChip";
import {
  COMPACT_COMMAND,
  ComposerCompactionBanner,
  useCompactionBanner,
} from "@/lib/components/chat/ComposerCompactionBanner";
import { useStopBackgroundAgent } from "@/lib/components/chat/useStopBackgroundAgent";
import {
  chatEntityKeys,
  type SandboxChatSurface,
} from "@/lib/components/chat/sandboxChatSurface";

/**
 * Everything stacked between the queued-messages panel and the composer input,
 * in the order every sandbox chat shows it: running sub-agents, the surface's
 * own banners, the compaction offer, then any banner that must sit last.
 */
export function SandboxChatPreInput({
  surface,
  beforeBanner,
  afterBanner,
}: {
  surface: SandboxChatSurface;
  /** Rendered under the sub-agents chip, above the compaction offer. */
  beforeBanner?: ReactNode;
  /** Rendered under the compaction offer, directly above the input. */
  afterBanner?: ReactNode;
}) {
  const { entityId } = chatEntityKeys(surface.entity);
  const requestStop = useStopBackgroundAgent(surface.entity);
  // A stopped sandbox cannot run `/compact`, so it counts as read-only here.
  const compaction = useCompactionBanner({
    repoId: surface.repoId,
    entityId,
    model: surface.composerModel.model,
    isExecuting: surface.isExecuting,
    isReadOnly: surface.isReadOnly || !surface.sandboxRunning,
  });
  const onSendCommand = surface.onSendCommand;

  return (
    <>
      <BackgroundAgentsChip
        backgroundAgents={surface.backgroundAgents}
        isReadOnly={surface.isReadOnly}
        onRequestStop={requestStop}
      />
      {beforeBanner}
      {compaction ? (
        <ComposerCompactionBanner
          usedTokens={compaction.usedTokens}
          onCompact={() => onSendCommand(COMPACT_COMMAND)}
          onDismiss={compaction.onDismiss}
        />
      ) : null}
      {afterBanner}
    </>
  );
}
