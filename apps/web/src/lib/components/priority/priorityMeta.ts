export type Priority = "urgent" | "high" | "medium" | "low";

export const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function priorityCompare(
  a: Priority | undefined,
  b: Priority | undefined,
): number {
  const ra = a === undefined ? 0 : PRIORITY_RANK[a];
  const rb = b === undefined ? 0 : PRIORITY_RANK[b];
  return ra - rb;
}
