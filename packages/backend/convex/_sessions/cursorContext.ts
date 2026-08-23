import type { AIProvider } from "../_validators/aiModels";
import { getAIModelProvider } from "../validators";

/** Includes a compact transcript when a legacy or current session uses Cursor. */
export function usesCursorConversationHandoff(input: {
  provider: AIProvider | undefined;
  lastModel: Parameters<typeof getAIModelProvider>[0];
}): boolean {
  return (input.provider ?? getAIModelProvider(input.lastModel)) === "cursor";
}
