import type { ActivityStep } from "./activity-shared";

/**
 * One row in the activity timeline. Subtask rows may nest child rows that ran
 * inside that agent (keyed by parentToolUseId → toolUseId).
 */
export interface ActivityRow {
  step: ActivityStep;
  children?: ActivityRow[];
}

/**
 * Status-filler thinking labels emitted by older callback versions (and by
 * prod until the current callback deploys). The response/reasoning text is
 * shown directly, so these narration rows are pure noise — hide them.
 */
const LEGACY_NOISE_LABELS = new Set([
  "Generating response...",
  "Generated response",
  "Streaming response...",
  "Streamed response",
  "Finalizing response...",
]);

/** Thinking labels that mark model reasoning rather than status narration. */
const REASONING_LABELS = new Set(["Thinking...", "Thought"]);

/** Placeholder details older callbacks attached to reasoning-label steps. */
const FILLER_DETAILS = new Set([
  "Claude is reasoning...",
  "Codex is reasoning...",
  "Opencode is reasoning...",
  "Cursor is reasoning...",
  "Receiving reply...",
]);

/**
 * Older callbacks stored reasoning as thinking steps labelled
 * "Thinking..."/"Thought". Remap those with real text to reasoning blocks;
 * drop the bare placeholder ones (nothing to show).
 */
export function normalizeStep(step: ActivityStep): ActivityStep | null {
  if (step.type !== "thinking") return step;
  if (LEGACY_NOISE_LABELS.has(step.label)) return null;
  if (REASONING_LABELS.has(step.label)) {
    if (step.detail && !FILLER_DETAILS.has(step.detail)) {
      return { ...step, type: "reasoning" };
    }
    return null;
  }
  return step;
}

/** Builds one row per normalized step (no consecutive-type merging). */
function stepsToRows(steps: ActivityStep[]): ActivityRow[] {
  const rows: ActivityRow[] = [];
  for (const raw of steps) {
    const step = normalizeStep(raw);
    if (!step) continue;
    rows.push({ step });
  }
  return rows;
}

/**
 * Builds per-call activity rows. Steps with `parentToolUseId` nest under the
 * matching subtask `toolUseId`. Orphans whose parent was never found append
 * at the top level (never drop).
 */
export function buildActivityRows(steps: ActivityStep[]): ActivityRow[] {
  const childrenByParent = new Map<string, ActivityStep[]>();
  const topLevel: ActivityStep[] = [];

  for (const step of steps) {
    const parentId = step.parentToolUseId;
    if (parentId) {
      const existing = childrenByParent.get(parentId);
      if (existing) existing.push(step);
      else childrenByParent.set(parentId, [step]);
    } else {
      topLevel.push(step);
    }
  }

  const rows = stepsToRows(topLevel);
  const attached = new Set<string>();

  for (const row of rows) {
    if (row.step.type !== "subtask") continue;
    const toolUseId = row.step.toolUseId;
    if (!toolUseId) continue;
    const kids = childrenByParent.get(toolUseId);
    if (kids && kids.length > 0) {
      row.children = stepsToRows(kids);
      attached.add(toolUseId);
    }
  }

  for (const [parentId, kids] of childrenByParent) {
    if (attached.has(parentId)) continue;
    rows.push(...stepsToRows(kids));
  }

  return rows;
}
