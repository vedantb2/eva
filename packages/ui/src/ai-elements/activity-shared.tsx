"use client";

import { cn } from "../utils/cn";
import {
  FileSearchIcon,
  PencilIcon,
  FilePlusIcon,
  TerminalIcon,
  FolderSearchIcon,
  FileTextIcon,
  GlobeIcon,
  SearchIcon,
  WorkflowIcon,
  BookOpenIcon,
  WrenchIcon,
  MessageSquareIcon,
  ListTodoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

/** One item in a todo checklist step (type "todos"). */
export interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
}

export interface ActivityStepOutput {
  text: string;
  exitCode?: number;
  truncated?: boolean;
}

export interface ActivityStepEdit {
  oldText: string;
  newText: string;
}

export interface ActivityStep {
  type:
    | "read"
    | "edit"
    | "write"
    | "bash"
    | "search_files"
    | "search_code"
    | "web_fetch"
    | "web_search"
    | "subtask"
    | "notebook"
    | "thinking"
    | "reasoning"
    | "response"
    | "question"
    | "todos"
    | "tool";
  label: string;
  detail?: string;
  /** Full, unshortened path for file-type steps. Powers the chat File Viewer. */
  path?: string;
  status: "complete" | "active";
  /** The tool_use id that produced this step (Claude only). */
  toolUseId?: string;
  /** Parent `Agent` tool_use id — set on steps that ran inside a subagent. */
  parentToolUseId?: string;
  /** Todo checklist snapshot (type "todos" only). */
  todos?: TodoItem[];
  /** Bash command (fuller than detail, capped). */
  command?: string;
  /** Tool result transcript (tail-capped). */
  output?: ActivityStepOutput;
  /** Edit before/after snippets. */
  edits?: ActivityStepEdit[];
  /** Codex file_change paths. */
  files?: string[];
  /** Write tool content head preview. */
  contentPreview?: string;
  /** True when the tool failed or exited non-zero. */
  isError?: boolean;
  /** Wall time from push → complete (ms). */
  durationMs?: number;
}

/** True when the step has expandable rich detail to show. */
export function stepHasRichDetail(step: ActivityStep): boolean {
  return Boolean(
    step.command ||
    step.output ||
    (step.edits && step.edits.length > 0) ||
    (step.files && step.files.length > 0) ||
    step.contentPreview,
  );
}

export function EvaThinkingIcon({ className }: { className?: string }) {
  return (
    <img
      src="/icon.svg"
      alt="Eva"
      width={16}
      height={16}
      className={cn("rounded-full", className)}
    />
  );
}

export const stepConfig = {
  read: { icon: FileSearchIcon, defaultLabel: "Read file" },
  edit: { icon: PencilIcon, defaultLabel: "Edited file" },
  write: { icon: FilePlusIcon, defaultLabel: "Created file" },
  bash: { icon: TerminalIcon, defaultLabel: "Ran command" },
  search_files: { icon: FolderSearchIcon, defaultLabel: "Found files" },
  search_code: { icon: FileTextIcon, defaultLabel: "Searched code" },
  web_fetch: { icon: GlobeIcon, defaultLabel: "Fetched URL" },
  web_search: { icon: SearchIcon, defaultLabel: "Web search" },
  subtask: { icon: WorkflowIcon, defaultLabel: "Ran agent" },
  notebook: { icon: BookOpenIcon, defaultLabel: "Edited notebook" },
  thinking: { icon: EvaThinkingIcon, defaultLabel: "Thinking..." },
  reasoning: { icon: EvaThinkingIcon, defaultLabel: "Thinking..." },
  response: { icon: MessageSquareIcon, defaultLabel: "Response" },
  question: { icon: MessageSquareIcon, defaultLabel: "Asked a question" },
  todos: { icon: ListTodoIcon, defaultLabel: "Task list" },
  tool: { icon: WrenchIcon, defaultLabel: "Used tool" },
};

const SPINNER_VERBS = [
  "Accomplishing",
  "Actioning",
  "Actualizing",
  "Architecting",
  "Baking",
  "Beaming",
  "Beboppin'",
  "Befuddling",
  "Billowing",
  "Blanching",
  "Bloviating",
  "Boogieing",
  "Boondoggling",
  "Booping",
  "Bootstrapping",
  "Brewing",
  "Bunning",
  "Burrowing",
  "Calculating",
  "Canoodling",
  "Caramelizing",
  "Cascading",
  "Catapulting",
  "Cerebrating",
  "Channeling",
  "Channelling",
  "Choreographing",
  "Churning",
  "Clauding",
  "Coalescing",
  "Cogitating",
  "Combobulating",
  "Composing",
  "Computing",
  "Concocting",
  "Considering",
  "Contemplating",
  "Cooking",
  "Crafting",
  "Creating",
  "Crunching",
  "Crystallizing",
  "Cultivating",
  "Deciphering",
  "Deliberating",
  "Determining",
  "Dilly-dallying",
  "Discombobulating",
  "Doing",
  "Doodling",
  "Drizzling",
  "Ebbing",
  "Effecting",
  "Elucidating",
  "Embellishing",
  "Enchanting",
  "Envisioning",
  "Evaporating",
  "Fermenting",
  "Fiddle-faddling",
  "Finagling",
  "Flambéing",
  "Flibbertigibbeting",
  "Flowing",
  "Flummoxing",
  "Fluttering",
  "Forging",
  "Forming",
  "Frolicking",
  "Frosting",
  "Gallivanting",
  "Galloping",
  "Garnishing",
  "Generating",
  "Gesticulating",
  "Germinating",
  "Gitifying",
  "Grooving",
  "Gusting",
  "Harmonizing",
  "Hashing",
  "Hatching",
  "Herding",
  "Honking",
  "Hullaballooing",
  "Hyperspacing",
  "Ideating",
  "Imagining",
  "Improvising",
  "Incubating",
  "Inferring",
  "Infusing",
  "Ionizing",
  "Jitterbugging",
  "Julienning",
  "Kneading",
  "Leavening",
  "Levitating",
  "Lollygagging",
  "Manifesting",
  "Marinating",
  "Meandering",
  "Metamorphosing",
  "Misting",
  "Moonwalking",
  "Moseying",
  "Mulling",
  "Mustering",
  "Musing",
  "Nebulizing",
  "Nesting",
  "Newspapering",
  "Noodling",
  "Nucleating",
  "Orbiting",
  "Orchestrating",
  "Osmosing",
  "Perambulating",
  "Percolating",
  "Perusing",
  "Philosophising",
  "Photosynthesizing",
  "Pollinating",
  "Pondering",
  "Pontificating",
  "Pouncing",
  "Precipitating",
  "Prestidigitating",
  "Processing",
  "Proofing",
  "Propagating",
  "Puttering",
  "Puzzling",
  "Quantumizing",
  "Razzle-dazzling",
  "Razzmatazzing",
  "Recombobulating",
  "Reticulating",
  "Roosting",
  "Ruminating",
  "Sautéing",
  "Scampering",
  "Schlepping",
  "Scurrying",
  "Seasoning",
  "Shenaniganing",
  "Shimmying",
  "Simmering",
  "Skedaddling",
  "Sketching",
  "Slithering",
  "Smooshing",
  "Sock-hopping",
  "Spelunking",
  "Spinning",
  "Sprouting",
  "Stewing",
  "Sublimating",
  "Swirling",
  "Swooping",
  "Symbioting",
  "Synthesizing",
  "Tempering",
  "Thinking",
  "Thundering",
  "Tinkering",
  "Tomfoolering",
  "Topsy-turvying",
  "Transfiguring",
  "Transmuting",
  "Twisting",
  "Undulating",
  "Unfurling",
  "Unravelling",
  "Vibing",
  "Waddling",
  "Wandering",
  "Warping",
  "Whatchamacalliting",
  "Whirlpooling",
  "Whirring",
  "Whisking",
  "Wibbling",
  "Working",
  "Wrangling",
  "Zesting",
  "Zigzagging",
] as const;

export function getRandomVerb(): string {
  return SPINNER_VERBS[Math.floor(Math.random() * SPINNER_VERBS.length)];
}

export function useSpinnerVerb(active: boolean): string {
  const [verb, setVerb] = useState(getRandomVerb);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setVerb(getRandomVerb());
    }, 3000);
    return () => clearInterval(id);
  }, [active]);
  return verb;
}

export function useElapsedSeconds(
  startedAt: number | undefined,
  active: boolean,
) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active || !startedAt) {
      setElapsed(0);
      return;
    }
    setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);
  return elapsed;
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
