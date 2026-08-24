import { normalizeAIModel, type AIModel } from "../validators";

/**
 * How an orchestrator-sent message must reach a child agent.
 *
 * - `queue`  — the agent already has a workflow in flight, so the message goes
 *              into `queuedMessages` and the queue drain inserts the user row.
 * - `start`  — the agent is idle, so the caller must insert the user message
 *              itself and then kick off a turn.
 */
export type AgentDelivery =
  | { action: "queue"; model: AIModel }
  | { action: "start"; model: AIModel };

/**
 * Pure busy-vs-queue + model-fallback decision for `send_agent_message`.
 *
 * The stored model is the fallback when the caller names none, and an explicit
 * `requestedModel` wins even when it belongs to another provider.
 * `normalizeAIModel` supplies the platform default when neither is set.
 */
export function resolveAgentDelivery(input: {
  isBusy: boolean;
  requestedModel?: string;
  storedModel?: string;
}): AgentDelivery {
  const model = normalizeAIModel(input.requestedModel ?? input.storedModel);
  return input.isBusy ? { action: "queue", model } : { action: "start", model };
}
