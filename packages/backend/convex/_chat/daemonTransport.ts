import type { Infer } from "convex/values";
import { getAIModelProvider } from "../validators";
import type { cursorTransportValidator } from "../_validators/tableFields";

type CursorTransport = Infer<typeof cursorTransportValidator>;

/** Claude and Cursor ACP always pull turns through their entity daemon. */
export function usesChatDaemon(
  model: string | null | undefined,
  cursorTransport: CursorTransport | undefined,
): boolean {
  void cursorTransport;
  const provider = getAIModelProvider(model);
  return provider === "claude" || provider === "cursor";
}
