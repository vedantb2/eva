import type { ActivityStep } from "./activity-shared";

export interface ActivityBlock {
  type: ActivityStep["type"];
  status: "active" | "complete";
  items: ActivityStep[];
}

/**
 * Walks steps in order and groups consecutive steps of the same type into a
 * single block (Cursor/Claude-style task grouping). A block is "active" iff
 * its last item is active.
 */
export function groupSteps(steps: ActivityStep[]): ActivityBlock[] {
  const blocks: ActivityBlock[] = [];

  for (const step of steps) {
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
  reasoning: () => "",
  response: () => "",
  question: () => "",
};

export function getBlockTitle(block: ActivityBlock): string {
  const builder = titleBuilders[block.type] ?? titleBuilders.tool;
  return builder(block.items.length, block.status === "active");
}
