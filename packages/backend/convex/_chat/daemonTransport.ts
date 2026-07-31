import type { Infer } from "convex/values";
import { getAIModelProvider } from "../validators";
import type { cursorTransportValidator } from "../_validators/tableFields";

type CursorTransport = Infer<typeof cursorTransportValidator>;

/** Claude always pulls turns; Cursor does so only for explicitly ACP-owned rows. */
export function usesChatDaemon(
  model: string | null | undefined,
  cursorTransport: CursorTransport | undefined,
): boolean {
  const provider = getAIModelProvider(model);
  return (
    provider === "claude" ||
    (provider === "cursor" && cursorTransport === "acp-v1")
  );
}
