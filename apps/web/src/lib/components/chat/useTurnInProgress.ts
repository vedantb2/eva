import { api } from "@eva/backend";
import type { FunctionArgs } from "convex/server";
import { useQuery } from "convex/react";

export type TurnSurface = FunctionArgs<typeof api.turns.getOpen>["surface"];

/**
 * The one signal for "this chat is working" (I1 of the turn-lease design).
 *
 * An open turn row means a turn is running; no row means it is not. Nothing
 * else gets a vote — not `activeWorkflowId`, not an empty placeholder message,
 * not the age of a streaming row. Those proxies are what let the UI say
 * "Working…" forever after a runner died, because each of them only cleared if
 * a specific mutation happened to fire. The row's lease expires on its own, so
 * a crashed owner converges without anyone having to remember to clean up.
 */
export function useTurnInProgress(
  surface: TurnSurface,
  entityId: string | undefined,
): boolean {
  const turn = useQuery(
    api.turns.getOpen,
    entityId === undefined ? "skip" : { surface, entityId },
  );
  return turn !== undefined && turn !== null;
}
