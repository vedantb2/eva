"use client";

import { useMutation } from "convex/react";
import { api, type Doc, type Id } from "@conductor/backend";
import { BackgroundAgentsChip as SharedBackgroundAgentsChip } from "@/lib/components/chat/BackgroundAgentsChip";

export function BackgroundAgentsChip({
  sessionId,
  backgroundAgents,
  isReadOnly,
}: {
  sessionId: Id<"sessions">;
  backgroundAgents: Doc<"sessions">["backgroundAgents"];
  isReadOnly?: boolean;
}) {
  const requestStop = useMutation(
    api.sessionWorkflow.requestStopBackgroundAgent,
  );

  return (
    <SharedBackgroundAgentsChip
      backgroundAgents={backgroundAgents}
      isReadOnly={isReadOnly}
      onRequestStop={async (toolUseId) => {
        await requestStop({ sessionId, toolUseId });
      }}
    />
  );
}
