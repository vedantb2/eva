"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  ChainOfThought,
  ChainOfThoughtStep,
  ChainOfThoughtContentArea,
  ChainOfThoughtHeader,
} from "./chain-of-thought";
import { cn } from "../utils/cn";
import { Spinner } from "../ui/spinner";
import { Shimmer } from "./shimmer";
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
} from "lucide-react";
import { memo, useState, useEffect, useRef } from "react";

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

function getRandomVerb(): string {
  return SPINNER_VERBS[Math.floor(Math.random() * SPINNER_VERBS.length)];
}

function useSpinnerVerb(active: boolean): string {
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

function EvaThinkingIcon({ className }: { className?: string }) {
  return (
    <img
      src="/icon.png"
      alt="Eva"
      width={16}
      height={16}
      className={cn("rounded-full", className)}
    />
  );
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
    | "question"
    | "tool";
  label: string;
  detail?: string;
  status: "complete" | "active";
}

const stepConfig = {
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
  question: { icon: MessageSquareIcon, defaultLabel: "Asked a question" },
  tool: { icon: WrenchIcon, defaultLabel: "Used tool" },
};

interface ActivityStepItemProps {
  step: ActivityStep;
  isLast: boolean;
}

const ActivityStepItem = memo(({ step, isLast }: ActivityStepItemProps) => {
  const config = stepConfig[step.type] ?? stepConfig.tool;

  return (
    <ChainOfThoughtStep
      icon={step.status === "active" ? undefined : config.icon}
      label={
        <div className="flex items-center gap-2">
          {step.status === "active" && <Spinner size="sm" />}
          {step.status === "active" ? (
            <Shimmer as="span" duration={2.5} spread={1.5}>
              {step.label}
            </Shimmer>
          ) : (
            <span>{step.label}</span>
          )}
        </div>
      }
      description={step.detail}
      status={step.status}
      className={isLast ? "[&_.bg-border]:hidden" : ""}
    />
  );
});

ActivityStepItem.displayName = "ActivityStepItem";

export interface ActivityStepsProps extends ComponentProps<"div"> {
  steps: ActivityStep[];
  isStreaming?: boolean;
  name?: string;
  icon?: ReactNode;
  startedAt?: number;
  duration?: string;
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

export const ActivitySteps = memo(
  ({
    steps,
    isStreaming,
    name,
    icon,
    className,
    startedAt,
    duration,
    ...props
  }: ActivityStepsProps) => {
    const [isOpen, setIsOpen] = useState(Boolean(isStreaming));
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const elapsed = useElapsedSeconds(startedAt, Boolean(isStreaming));

    useEffect(() => {
      setIsOpen(Boolean(isStreaming));
    }, [isStreaming]);

    useEffect(() => {
      if (!isOpen) return;
      const container = scrollContainerRef.current;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    }, [isOpen, steps.length]);

    if (steps.length === 0) return null;

    const verb = useSpinnerVerb(Boolean(isStreaming));
    const stepsText = `${steps.length} ${steps.length === 1 ? "time" : "times"}`;
    const timeText =
      isStreaming && startedAt
        ? formatElapsed(elapsed)
        : !isStreaming && duration
          ? duration
          : null;
    const headerLabel = isStreaming
      ? name
        ? timeText
          ? `${name} is ${verb.toLowerCase()}... (${stepsText} · ${timeText})`
          : `${name} is ${verb.toLowerCase()}... (${stepsText})`
        : timeText
          ? `${verb}... (${stepsText} · ${timeText})`
          : `${verb}... (${stepsText})`
      : name
        ? timeText
          ? `${name} cooked ${stepsText} in ${timeText}`
          : `${name} cooked ${stepsText}`
        : timeText
          ? `Cooked ${stepsText} in ${timeText}`
          : `Cooked ${stepsText}`;

    return (
      <ChainOfThought
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn("text-sm", className)}
        {...props}
      >
        <ChainOfThoughtHeader icon={icon}>
          {isStreaming ? (
            <Shimmer as="span" duration={2.5} spread={1.5}>
              {headerLabel}
            </Shimmer>
          ) : (
            headerLabel
          )}
        </ChainOfThoughtHeader>
        <ChainOfThoughtContentArea>
          <div
            ref={scrollContainerRef}
            className="space-y-1 max-h-64 overflow-y-auto scrollbar"
          >
            {steps.map((step, i) => (
              <ActivityStepItem
                key={i}
                step={step}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>
        </ChainOfThoughtContentArea>
      </ChainOfThought>
    );
  },
);

ActivitySteps.displayName = "ActivitySteps";
