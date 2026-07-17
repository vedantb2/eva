import type { ActivityStep } from "./activity-shared";

export interface ActivityBlock {
  type: ActivityStep["type"];
  status: "active" | "complete";
  items: ActivityStep[];
  /**
   * For `subtask` blocks only: the nested activity of each subagent, keyed by
   * that subagent's `Agent` tool_use id. Lets the UI expand a subagent row to
   * show the reads/edits/commands it ran.
   */
  subtaskChildren?: Record<string, ActivityBlock[]>;
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

/**
 * Walks steps in order and groups consecutive steps of the same type into a
 * single block (Cursor/Claude-style task grouping). A block is "active" iff
 * its last item is active.
 */
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
function normalizeStep(step: ActivityStep): ActivityStep | null {
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

/** Groups consecutive same-type steps into blocks (no subagent partitioning). */
function groupConsecutive(steps: ActivityStep[]): ActivityBlock[] {
  const blocks: ActivityBlock[] = [];
  for (const rawStep of steps) {
    const step = normalizeStep(rawStep);
    if (!step) continue;
    const previous = blocks[blocks.length - 1];
    if (previous && previous.type === step.type) {
      previous.items.push(step);
    } else {
      blocks.push({ type: step.type, status: step.status, items: [step] });
    }
  }
  for (const block of blocks) {
    block.status = block.items[block.items.length - 1].status;
  }
  return blocks;
}

/**
 * Groups steps into activity blocks. Steps that ran inside a subagent (those
 * with `parentToolUseId`) are pulled out of the main flow and nested under the
 * matching `subtask` block instead, so a subagent renders as one expandable row
 * showing its own reads/edits/commands rather than flattening into the timeline.
 */
export function groupSteps(steps: ActivityStep[]): ActivityBlock[] {
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

  const blocks = groupConsecutive(topLevel);
  const attached = new Set<string>();
  for (const block of blocks) {
    if (block.type !== "subtask") continue;
    const children: Record<string, ActivityBlock[]> = {};
    for (const item of block.items) {
      const toolUseId = item.toolUseId;
      if (!toolUseId) continue;
      const kids = childrenByParent.get(toolUseId);
      if (kids && kids.length > 0) {
        children[toolUseId] = groupConsecutive(kids);
        attached.add(toolUseId);
      }
    }
    if (Object.keys(children).length > 0) block.subtaskChildren = children;
  }

  // Fallback: never drop activity. Any children whose parent subtask wasn't
  // found (e.g. deep nesting) are appended at the top level rather than lost.
  for (const [parentId, kids] of childrenByParent) {
    if (attached.has(parentId)) continue;
    blocks.push(...groupConsecutive(kids));
  }

  return blocks;
}

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

const titleBuilders: Record<
  ActivityStep["type"],
  (n: number, active: boolean) => string
> = {
  read: (n, active) =>
    active
      ? `Reading ${n} ${pluralize(n, "file", "files")}`
      : `Read ${n} ${pluralize(n, "file", "files")}`,
  edit: (n, active) =>
    active
      ? `Editing ${n} ${pluralize(n, "file", "files")}`
      : `Edited ${n} ${pluralize(n, "file", "files")}`,
  write: (n, active) =>
    active
      ? `Creating ${n} ${pluralize(n, "file", "files")}`
      : `Created ${n} ${pluralize(n, "file", "files")}`,
  bash: (n, active) =>
    active
      ? `Running ${n} ${pluralize(n, "command", "commands")}`
      : `Ran ${n} ${pluralize(n, "command", "commands")}`,
  search_files: (_n, active) => (active ? "Searching files" : "Searched files"),
  search_code: (_n, active) => (active ? "Searching code" : "Searched code"),
  web_fetch: (n, active) =>
    active
      ? `Fetching ${n} ${pluralize(n, "URL", "URLs")}`
      : `Fetched ${n} ${pluralize(n, "URL", "URLs")}`,
  web_search: (_n, active) =>
    active ? "Searching the web" : "Searched the web",
  subtask: (n, active) =>
    active
      ? `Running ${n} ${pluralize(n, "agent", "agents")}`
      : `Ran ${n} ${pluralize(n, "agent", "agents")}`,
  notebook: (n, active) =>
    active
      ? `Editing ${n} ${pluralize(n, "notebook", "notebooks")}`
      : `Edited ${n} ${pluralize(n, "notebook", "notebooks")}`,
  tool: (n, active) =>
    active
      ? `Using ${n} ${pluralize(n, "tool", "tools")}`
      : `Used ${n} ${pluralize(n, "tool", "tools")}`,
  thinking: () => "",
  reasoning: (_n, active) => (active ? "Thinking..." : "Thought"),
  response: () => "",
  question: () => "",
  todos: (_n, active) => (active ? "Updating tasks" : "Task list"),
};

export function getBlockTitle(block: ActivityBlock): string {
  const builder = titleBuilders[block.type] ?? titleBuilders.tool;
  return builder(block.items.length, block.status === "active");
}

/**
 * Runs recorded by an interim callback version bake the final response text
 * into both the last activity step AND the run's resultSummary/message
 * content, which is rendered directly below the activity. Newer callback
 * versions drop the trailing response step at completion, so this only
 * matters for older stored runs. Given the finished blocks and the text
 * rendered alongside them, drop the trailing response block when its text
 * duplicates (or is a prefix/superset of) that final text.
 */
export function dropTrailingResponseBlock(
  blocks: ActivityBlock[],
  finalText: string | undefined,
): ActivityBlock[] {
  if (!finalText) return blocks;
  const trimmedFinal = finalText.trim();
  if (!trimmedFinal) return blocks;

  const lastBlock = blocks[blocks.length - 1];
  if (!lastBlock || lastBlock.type !== "response") return blocks;

  const blockText = lastBlock.items
    .map((item) => item.detail ?? item.label)
    .join("\n\n")
    .trim();
  if (!blockText) return blocks;

  const isDuplicate =
    blockText === trimmedFinal ||
    blockText.startsWith(trimmedFinal) ||
    trimmedFinal.startsWith(blockText);
  if (!isDuplicate) return blocks;

  return blocks.slice(0, -1);
}
