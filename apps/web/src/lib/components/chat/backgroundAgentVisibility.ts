import type { BackgroundAgentEntry } from "@eva/backend";

export function isVisibleBackgroundAgent(
  agent: BackgroundAgentEntry,
): boolean {
  return agent.status === "running" && agent.backgrounded === true;
}
