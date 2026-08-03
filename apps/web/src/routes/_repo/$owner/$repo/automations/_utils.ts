import type { StatusTone } from "@eva/ui";
import type { Doc } from "@eva/backend";

type AutomationRun = Doc<"automationRuns">;
type Finding = NonNullable<AutomationRun["findings"]>[number];

/**
 * `StatusDot` tone per finding severity — a small glyph beside neutral text
 * rather than a loud filled pill.
 *
 * `high` and `medium` borrow the workflow ramp's orange and yellow. Those are
 * the app's only two mid-warm steps, and adding severity-specific ones would
 * invent a new tone step, which the colour ladder forbids. The names read oddly
 * here; the resulting red → orange → yellow → grey ramp does not.
 *
 * Local to this route on purpose — `testing-arena` has its own copy for issue
 * severity. The two scales are conceptually distinct even though the values
 * match today, and sharing four lines would couple two unrelated features.
 */
export const SEVERITY_TONE: Record<Finding["severity"], StatusTone> = {
  critical: "critical",
  high: "business-review",
  medium: "progress",
  low: "neutral",
};
