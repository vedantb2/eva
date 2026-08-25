import type { FunctionReturnType } from "convex/server";
import { type api, type Id } from "@eva/backend";

/**
 * One account's latest reading, minus the fields only the table row carries.
 * Derived from the query's return type rather than restated, so a schema change
 * fails here instead of drifting — while still letting a test build one from a
 * literal. Taken from the query rather than the Doc because `accountLabel` is
 * resolved on read and exists only in the query's result.
 */
export type UsageSnapshot = Omit<
  FunctionReturnType<typeof api.usageLimits.getByRepo>[number],
  "_id" | "_creationTime" | "repoId"
>;

export type UsageWindow = NonNullable<UsageSnapshot["windows"]>[number];

/**
 * The one credential a surface's usage belongs to. Branded rather than a bare
 * string because the refresh action reads the account with it — a surface that
 * cannot name its account cannot ask for a reading either.
 */
export interface UsageAccountScope {
  /** null is the shared team credential, which has no account row. */
  providerAccountId: Id<"userProviderAccounts"> | null;
  accountLabel: string;
}

/** Utilisation at which a window stops reading as routine. */
export const WARNING_UTILIZATION = 80;
/** Utilisation at which it reads as about to be refused. */
export const DANGER_UTILIZATION = 95;
/** Mirrors the server-side freshness gate in `usageLimits.getByRepo`. */
export const USAGE_READING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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
export function reportedWindows(
  snapshot: UsageSnapshot,
  now: number,
): UsageWindow[] {
  return (snapshot.windows ?? []).filter(
    (window) =>
      window.utilization !== undefined &&
      (window.resetsAt === undefined || window.resetsAt > now),
  );
}

/**
 * Windows that meter spend beyond the plan rather than headroom within it.
 * They still earn a row in the card — money spent is worth seeing — but they
 * are not a constraint, so a full overage meter must not colour the chip as if
 * the plan were about to refuse work.
 */
const SPEND_METER_WINDOW_KEYS: ReadonlySet<string> = new Set([
  "overage",
  "seven_day_overage_included",
]);

/** The tightest constraint the snapshot reports, if it reports any. */
export function maxUtilization(
  snapshot: UsageSnapshot,
  now: number,
): number | undefined {
  const utilizations = reportedWindows(snapshot, now)
    .filter((window) => !SPEND_METER_WINDOW_KEYS.has(window.key))
    .map((window) => window.utilization ?? 0);
  return utilizations.length === 0 ? undefined : Math.max(...utilizations);
}

/** Status remains meaningful until its associated windows have all reset. */
export function activeUsageStatus(
  snapshot: UsageSnapshot,
  now: number,
): UsageSnapshot["status"] {
  const windows = snapshot.windows ?? [];
  if (windows.length === 0) return snapshot.status;
  const hasUnexpiredWindow = windows.some(
    (window) => window.resetsAt === undefined || window.resetsAt > now,
  );
  return hasUnexpiredWindow ? snapshot.status : undefined;
}

export function formatUtilization(utilization: number): string {
  return `${Math.round(utilization)}%`;
}

const MINUTE_MS = 60_000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

/**
 * Time still to run on a window, at the coarsest useful granularity: "2d 23h",
 * "2h 28m", "45m". Deliberately not `formatDurationCompactMs`, which has no day
 * unit — a weekly window would read "167h 12m" there, and its other callers
 * measure agent work, where hours are the right ceiling.
 *
 * Rounds the smallest shown unit UP, carrying, so a countdown never claims a
 * reset lands sooner than it does (and never reads "0m" with time left).
 */
export function formatResetDistanceMs(ms: number): string {
  const totalMinutes = Math.ceil(ms / MINUTE_MS);
  if (totalMinutes < MINUTES_PER_HOUR) return `${totalMinutes}m`;
  if (totalMinutes < MINUTES_PER_DAY) {
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  const totalHours = Math.ceil(totalMinutes / MINUTES_PER_HOUR);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

/** "resets in 2h 15m", or the moment it has already passed. */
export function resetsInLabel(resetsAt: number, now: number): string {
  const remaining = resetsAt - now;
  return remaining <= 0
    ? "resets now"
    : `resets in ${formatResetDistanceMs(remaining)}`;
}

export interface ChipSummary {
  label: string;
  /** Fill for the chip's meter; absent when the provider reports no windows. */
  utilization?: number;
  tone: UsageTone;
}

/**
 * What the collapsed chip says: the plan windows, which are the real
 * constraint. A reading without any still matters when the provider flagged it,
 * and returning nothing is how the whole feature stays invisible until a turn
 * has reported something.
 *
 * The number is the tightest constraint anywhere in the card — the highest
 * utilisation across every account, not the freshest row's. One chip stands in
 * for several accounts, so the one closest to being refused is the one worth
 * showing; and its tone also carries any other account's flagged status, which
 * would otherwise be hidden behind a collapsed card.
 */
export function chipSummary(
  rows: readonly UsageSnapshot[],
  now: number,
): ChipSummary | undefined {
  let tightest: number | undefined;
  let tone: UsageTone = "neutral";
  for (const row of rows) {
    if (now - row.capturedAt > USAGE_READING_MAX_AGE_MS) continue;
    tone = worseTone(tone, toneForStatus(activeUsageStatus(row, now)));
    const utilization = maxUtilization(row, now);
    if (utilization === undefined) continue;
    if (tightest === undefined || utilization > tightest) {
      tightest = utilization;
    }
    tone = worseTone(tone, toneForUtilization(utilization));
  }
  if (tightest !== undefined) {
    return { label: formatUtilization(tightest), utilization: tightest, tone };
  }
  const flagged = rows.find(
    (row) =>
      now - row.capturedAt <= USAGE_READING_MAX_AGE_MS &&
      toneForStatus(activeUsageStatus(row, now)) !== "neutral",
  );
  if (!flagged) return undefined;
  return {
    label: flagged.status === "rejected" ? "Limit reached" : "Near limit",
    tone: toneForStatus(activeUsageStatus(flagged, now)),
  };
}

/** Only the selected credential's limits belong beside its model picker. */
export function usageRowsForAccount<Row extends { providerAccountId?: string }>(
  rows: readonly Row[],
  /** Only the id is read here, so a `UsageAccountScope` is more than enough. */
  scope: { providerAccountId: string | null } | undefined,
): Row[] {
  if (!scope) return [...rows];
  const providerAccountId = scope.providerAccountId ?? undefined;
  return rows.filter((row) => row.providerAccountId === providerAccountId);
}

type UsageProvider = UsageSnapshot["provider"];

/**
 * Display name per provider. A record rather than a ternary, so adding a
 * provider to the Convex validator fails to compile until it gets a name.
 */
const PROVIDER_LABELS: Record<UsageProvider, string> = { claude: "Claude" };

/** "Claude · Max plan" — the plan half is dropped for an API-key session. */
export function providerHeading(snapshot: UsageSnapshot): string {
  const provider = PROVIDER_LABELS[snapshot.provider];
  const plan = snapshot.subscriptionType;
  if (!plan) return provider;
  return `${provider} · ${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`;
}

/**
 * Identity of one section: a provider can appear once per connected account, so
 * the provider alone is not a stable React key. Structural rather than taking a
 * whole snapshot — the id is only ever read as a string here.
 */
export function sectionKey(snapshot: {
  provider: UsageProvider;
  providerAccountId?: string;
}): string {
  return `${snapshot.provider}:${snapshot.providerAccountId ?? ""}`;
}

/**
 * Sections in display order. Rows arrive newest-first, which would let one
 * provider's reading land between two of another's accounts; grouping keeps one
 * provider's accounts adjacent while leaving both the provider order and the
 * order of accounts within a provider as captured — freshest first.
 */
export function orderedSections<Row extends { provider: UsageProvider }>(
  rows: readonly Row[],
): Row[] {
  const byProvider = new Map<UsageProvider, Row[]>();
  for (const row of rows) {
    const group = byProvider.get(row.provider);
    if (group) {
      group.push(row);
    } else {
      byProvider.set(row.provider, [row]);
    }
  }
  return [...byProvider.values()].flat();
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

/**
 * Hover copy when the selected account has nothing to draw. A fresh row with
 * no windows means we asked and Claude has no plan rate limits to show
 * (Team/Enterprise spend caps live on claude.ai). No row at all still means
 * no turn has reported for this credential yet.
 */
export function emptyAccountUsageCopy(
  rows: readonly UsageSnapshot[],
  now: number,
): string {
  const hasFreshReading = rows.some(
    (row) => now - row.capturedAt <= USAGE_READING_MAX_AGE_MS,
  );
  return hasFreshReading
    ? "Claude isn't reporting plan rate limits for this account."
    : "No plan usage has been reported for this account yet.";
}
