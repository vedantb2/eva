import type { FunctionReturnType } from "convex/server";
import type { api } from "@eva/backend";

type SessionDesignMessage = NonNullable<
  FunctionReturnType<typeof api.messages.getLatestSessionDesignMessage>
>;

export type DesignVariation = NonNullable<
  SessionDesignMessage["variations"]
>[number];

/** Letter key for design-preview `?v=` from zero-based variation index. */
export function variationKeyFromIndex(index: number): string {
  return String.fromCharCode(97 + index);
}

/** True when the tab value is a valid variation index for the current set. */
export function isValidVariationTab(
  tab: string,
  variationCount: number,
): boolean {
  if (!/^\d+$/.test(tab)) return false;
  const index = Number(tab);
  return Number.isInteger(index) && index >= 0 && index < variationCount;
}
