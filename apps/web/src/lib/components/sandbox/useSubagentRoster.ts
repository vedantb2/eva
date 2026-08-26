"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type BackgroundAgentEntry } from "@eva/backend";
import { isAssistantTurnInProgress } from "@/lib/components/chat/chatBodyUtils";
import {
  chatEntityKeys,
  type ChatEntityRef,
} from "@/lib/components/chat/sandboxChatSurface";
import {
  deriveSubagents,
  subagentTone,
  type SubagentView,
} from "./agentActivity";

interface SubagentRoster {
  agents: SubagentView[];
  /** Content key for the Agents tab: it appears once agents exist. */
  hasAgents: boolean;
  hasRunningAgents: boolean;
}

/**
 * Agents-tab roster for every sandbox panel, folded from the chat transcript.
 * Both queries are the ones the matching chat panel already runs with the same
 * arguments, so the cached client shares one subscription each.
 */
export function useSubagentRoster({
  entity,
  backgroundAgents,
  sandboxRunning,
}: {
  /** The session, task, or project the sandbox belongs to. */
  entity: ChatEntityRef;
  backgroundAgents: BackgroundAgentEntry[] | undefined;
  sandboxRunning: boolean;
}): SubagentRoster {
  const { parentId, streamingEntityId } = chatEntityKeys(entity);
  const messages = useQuery(api.messages.listByParent, { parentId });
  const streaming = useQuery(api.streaming.get, {
    entityId: streamingEntityId,
  });

  const turns = messages ?? [];
  const agents = deriveSubagents({
    activityLogs: turns.map((message) => message.activityLog),
    // Streaming payloads can outlive their turn; only fold them while one runs.
    streamingActivity: isAssistantTurnInProgress(turns)
      ? streaming?.currentActivity
      : undefined,
    backgroundAgents,
    sandboxRunning,
  });

  return {
    agents,
    hasAgents: agents.length > 0,
    hasRunningAgents: agents.some(
      (agent) => subagentTone(agent.status) === "active",
    ),
  };
}
