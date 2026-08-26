import type { ActivityStep } from "@eva/ui";
import { parseAsString, useQueryState } from "nuqs";
import type { SubagentView } from "@/lib/components/sandbox/agentActivity";

/**
 * `?mockAgents=1` — the demo/screenshot switch for the whole sub-agent story:
 * the chat CTA row, the Agents sandbox tab, and the roster inside it. Every
 * consumer reads the flag through {@link useMockAgentsEnabled}, so the feature
 * has exactly one on/off point and is inert when the param is absent.
 */
const mockAgentsParser = parseAsString.withOptions({ history: "replace" });

/** True while `?mockAgents=1` (anything but absent / `0` / `false`) is set. */
export function useMockAgentsEnabled(): boolean {
  const [mockAgents] = useQueryState("mockAgents", mockAgentsParser);
  return mockAgents !== null && mockAgents !== "0" && mockAgents !== "false";
}

/**
 * Simple view hides the Agents tab and bounces `/agents` to Preview, which
 * would dead-end the demo the moment the CTA row is clicked. The mock wins over
 * that hiding — and only for the Agents tab, and only under the param.
 */
export function useMockAgentsRevealsTab(tab: string): boolean {
  const mockAgents = useMockAgentsEnabled();
  return mockAgents && tab === "agents";
}

/**
 * Fixed at module load so the running agent's elapsed timer ticks up from a
 * plausible starting point instead of resetting on every render.
 */
const NOW = Date.now();
const MINUTE = 60_000;

function step(
  type: ActivityStep["type"],
  label: string,
  rest: Omit<ActivityStep, "type" | "label" | "status"> & {
    status?: ActivityStep["status"];
  } = {},
): ActivityStep {
  const { status = "complete", ...extra } = rest;
  return { type, label, status, ...extra };
}

/**
 * The roster the Agents tab shows under `?mockAgents=1`: three sub-agents, one
 * still working, matching what the chat CTA row claims. None are `backgrounded`,
 * so `AgentsPanel` renders no Stop button and the mock rows cannot fire the
 * stop mutation.
 */
export const MOCK_SUBAGENTS: SubagentView[] = [
  {
    toolUseId: "mock_agent_explore",
    title: "Explore composer surfaces",
    status: "running",
    backgrounded: false,
    startedAt: NOW - 42_000,
    steps: [
      step("search_code", "Searched for ComposerTasksPanel", {
        detail: "apps/web/src/lib/components/chat",
        durationMs: 1_400,
      }),
      step("read", "Read ChatComposer.tsx", {
        path: "apps/web/src/lib/components/chat/ChatComposer.tsx",
        durationMs: 320,
      }),
      step("read", "Reading ChatBody.tsx", {
        path: "apps/web/src/lib/components/chat/ChatBody.tsx",
        status: "active",
      }),
    ],
  },
  {
    toolUseId: "mock_agent_implement",
    title: "Implement tasks panel",
    status: "completed",
    backgrounded: false,
    startedAt: NOW - 9 * MINUTE,
    settledAt: NOW - 6 * MINUTE,
    steps: [
      step("write", "Wrote ComposerTasksPanel.tsx", {
        path: "apps/web/src/lib/components/chat/_components/ComposerTasksPanel.tsx",
        durationMs: 2_100,
      }),
      step("edit", "Edited ChatComposer.tsx", {
        path: "apps/web/src/lib/components/chat/ChatComposer.tsx",
        durationMs: 640,
      }),
      step("bash", "Ran type check", {
        command: "npx tsc -p tsconfig.json --noEmit",
        durationMs: 48_000,
        output: { text: "", exitCode: 0 },
      }),
    ],
    resultText:
      "Added the composer tasks panel and wired it above the queued messages. Type check is clean.",
  },
  {
    toolUseId: "mock_agent_capture",
    title: "Capture proof screenshots",
    status: "completed",
    backgrounded: false,
    startedAt: NOW - 6 * MINUTE,
    settledAt: NOW - 4 * MINUTE,
    steps: [
      step("bash", "Started the dev server", {
        command: "pnpm dev --filter web",
        durationMs: 12_000,
      }),
      step("tool", "Captured screenshots/tasks-panel.png", {
        detail: "1280x800",
        durationMs: 3_800,
      }),
    ],
    resultText: "Two screenshots saved under screenshots/.",
  },
];
