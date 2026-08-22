import type { Doc } from "@eva/backend";
import { formatDurationCompactMs } from "@eva/shared/duration";

/**
 * One provider's latest reading, minus the fields only the table row carries.
 * Derived from the Doc rather than restated, so a schema change fails here
 * instead of drifting — while still letting a test build one from a literal.
 */
export type UsageSnapshot = Omit<
  Doc<"agentUsageLimits">,
  "_id" | "_creationTime" | "repoId"
>;

export type UsageWindow = NonNullable<UsageSnapshot["windows"]>[number];

/** Utilisation at which a window stops reading as routine. */
export const WARNING_UTILIZATION = 80;
/** Utilisation at which it reads as about to be refused. */
export const DANGER_UTILIZATION = 95;

export type UsageTone = "neutral" | "warning" | "danger";

const TONE_ORDER: UsageTone[] = ["neutral", "warning", "danger"];

/** Text colour for a tone. One place, so chip and rows cannot disagree. */
export const USAGE_TONE_TEXT_CLASS: Record<UsageTone, string> = {
  neutral: "text-muted-foreground",
  warning: "text-warning",
  danger: "text-destructive",
};

/** Bar fill for a tone. `primary` is user-themed, so it is never hardcoded. */
export const USAGE_TONE_FILL_CLASS: Record<UsageTone, string> = {
  neutral: "bg-primary",
  warning: "bg-warning",
  danger: "bg-destructive",
};

export function toneForUtilization(utilization: number): UsageTone {
  if (utilization >= DANGER_UTILIZATION) return "danger";
  if (utilization >= WARNING_UTILIZATION) return "warning";
  return "neutral";
}

/** The provider's own verdict, which is all a windowless reading reports. */
export function toneForStatus(status: UsageSnapshot["status"]): UsageTone {
  if (status === "rejected") return "danger";
  if (status === "allowed_warning") return "warning";
  return "neutral";
}

/**
 * The more severe of two tones. A provider can warn while every window it
 * reports still sits low, and that warning is the part worth surfacing.
 */
export function worseTone(a: UsageTone, b: UsageTone): UsageTone {
  return TONE_ORDER.indexOf(a) >= TONE_ORDER.indexOf(b) ? a : b;
}

/** Windows worth a row: one with no utilisation has nothing to draw. */
export function reportedWindows(snapshot: UsageSnapshot): UsageWindow[] {
  return (snapshot.windows ?? []).filter(
    (window) => window.utilization !== undefined,
  );
}

/** The tightest constraint the snapshot reports, if it reports any. */
export function maxUtilization(snapshot: UsageSnapshot): number | undefined {
  const utilizations = reportedWindows(snapshot).map(
    (window) => window.utilization ?? 0,
  );
  return utilizations.length === 0 ? undefined : Math.max(...utilizations);
}

export function formatUtilization(utilization: number): string {
  return `${Math.round(utilization)}%`;
}

/**
 * Cursor bills in USD cents. Deliberately not `formatCost`, which converts a
 * USD *dollar* amount to GBP for the logs pages — a different unit either side.
 */
export function formatCostCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** "resets in 2h 15m", or the moment it has already passed. */
export function resetsInLabel(resetsAt: number, now: number): string {
  const remaining = resetsAt - now;
  return remaining <= 0
    ? "resets now"
    : `resets in ${formatDurationCompactMs(remaining)}`;
}

export interface ChipSummary {
  label: string;
  /** Fill for the chip's meter; absent when the provider reports no windows. */
  utilization?: number;
  tone: UsageTone;
}

/**
 * What the collapsed chip says. Claude's plan windows are the real constraint,
 * so they win; a Cursor-only repo has cumulative spend instead. A reading with
 * neither still matters when the provider flagged it, and returning nothing is
 * how the whole feature stays invisible until a turn has reported something.
 */
export function chipSummary(
  rows: readonly UsageSnapshot[],
): ChipSummary | undefined {
  for (const row of rows) {
    const utilization = maxUtilization(row);
    if (utilization !== undefined) {
      return {
        label: formatUtilization(utilization),
        utilization,
        tone: worseTone(
          toneForUtilization(utilization),
          toneForStatus(row.status),
        ),
      };
    }
  }
  for (const row of rows) {
    if (row.costCents !== undefined) {
      return {
        label: formatCostCents(row.costCents),
        tone: toneForStatus(row.status),
      };
    }
  }
  const flagged = rows.find((row) => toneForStatus(row.status) !== "neutral");
  if (!flagged) return undefined;
  return {
    label: flagged.status === "rejected" ? "Limit reached" : "Near limit",
    tone: toneForStatus(flagged.status),
  };
}

/** "Claude · Max plan" — the plan half is dropped for an API-key session. */
export function providerHeading(snapshot: UsageSnapshot): string {
  const provider = snapshot.provider === "claude" ? "Claude" : "Cursor";
  const plan = snapshot.subscriptionType;
  if (!plan) return provider;
  return `${provider} · ${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`;
}

/** The freshest reading across providers, for the card's single footer. */
export function newestCapturedAt(
  rows: readonly UsageSnapshot[],
): number | undefined {
  return rows.reduce<number | undefined>(
    (newest, row) =>
      newest === undefined || row.capturedAt > newest ? row.capturedAt : newest,
    undefined,
  );
}
