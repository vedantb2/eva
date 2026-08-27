"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type BackgroundAgentEntry, type Id } from "@eva/backend";
import { isAssistantTurnInProgress } from "@/lib/components/chat/chatBodyUtils";
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
 * Agents-tab roster for the task and project sandbox panels. Sessions fold
 * theirs inside `SandboxPanel` from props the session shell already holds;
 * these two shells never query the chat transcript, so the panel subscribes
 * itself. Both queries are the ones the matching chat panel already runs with
 * the same arguments, so the cached client shares one subscription each.
 */
export function useSubagentRoster({
  parentId,
  streamingEntityId,
  backgroundAgents,
  sandboxRunning,
}: {
  /** Chat transcript owner — the task or project the sandbox belongs to. */
  parentId: Id<"agentTasks"> | Id<"projects">;
  /** `api.streaming.get` entity id for that surface's chat turn. */
  streamingEntityId: string;
  backgroundAgents: BackgroundAgentEntry[] | undefined;
  sandboxRunning: boolean;
}): SubagentRoster {
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
