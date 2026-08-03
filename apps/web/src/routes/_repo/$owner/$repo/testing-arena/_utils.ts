import type { FunctionReturnType } from "convex/server";
import type { StatusTone } from "@eva/ui";
import type { api } from "@eva/backend";

type EvaluationReport = FunctionReturnType<
  typeof api.evaluationReports.listByDoc
>[number];
type Issue = NonNullable<EvaluationReport["issues"]>[number];

/**
 * `StatusDot` tone per issue severity — a small glyph beside neutral text
 * rather than a loud filled pill.
 *
 * `high` and `medium` borrow the workflow ramp's orange and yellow. Those are
 * the app's only two mid-warm steps, and adding severity-specific ones would
 * invent a new tone step, which the colour ladder forbids. The names read oddly
 * here; the resulting red → orange → yellow → grey ramp does not.
 *
 * Local to this route on purpose — `automations` has its own copy for finding
 * severity. The two scales are conceptually distinct even though the values
 * match today, and sharing four lines would couple two unrelated features.
 */
export const SEVERITY_TONE: Record<Issue["severity"], StatusTone> = {
  critical: "critical",
  high: "business-review",
  medium: "progress",
  low: "neutral",
};
