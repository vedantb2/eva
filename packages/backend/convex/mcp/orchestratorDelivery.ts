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

/** One mutation to run as the sending user, by Convex function path. */
export interface SessionMessageCall {
  fn: string;
  args: Record<string, string | boolean>;
}

/**
 * The mutations that put one message into an existing session's chat, in order.
 * Shared by every MCP send path (master session and user token alike) so a
 * message from outside the web app lands exactly as a composer send does — and
 * never as a new task or session.
 *
 * `start` is two calls because `startExecute` only stages the assistant
 * placeholder: the user row has to be inserted first or the turn runs with no
 * visible prompt. `queue` is one, because the queue drain inserts the user row
 * itself on dequeue.
 */
export function buildSessionMessageCalls(input: {
  sessionId: string;
  message: string;
  delivery: AgentDelivery;
  /** Stamps the "via master" chat badge. True only for orchestrator sends. */
  sentViaOrchestrator: boolean;
}): SessionMessageCall[] {
  const { sessionId, message, delivery, sentViaOrchestrator } = input;

  if (delivery.action === "queue") {
    return [
      {
        fn: "_sessions/execution:enqueueMessage",
        args: {
          sessionId,
          message,
          model: delivery.model,
          sentViaOrchestrator,
        },
      },
    ];
  }

  return [
    {
      fn: "_sessions/mutations:addMessage",
      args: {
        id: sessionId,
        role: "user",
        content: message,
        model: delivery.model,
        sentViaOrchestrator,
      },
    },
    {
      fn: "_sessions/execution:startExecute",
      args: { sessionId, message, model: delivery.model },
    },
  ];
}
