import { cn } from "@eva/ui";
import {
  IconCheck,
  IconChevronRight,
  IconRobot,
} from "@tabler/icons-react";
import { parseAsString, useQueryState } from "nuqs";
import type { BackgroundAgentEntry } from "@eva/backend";
import {
  deriveSubagents,
  subagentTone,
} from "@/lib/components/sandbox/agentActivity";
import { formatTokens } from "@/lib/utils/logs";

/**
 * What one assistant turn's sub-agent batch looks like from the timeline: how
 * many were spawned and how they are getting on. Deliberately a flat summary —
 * the Agents tab owns the roster, this row is only the doorway to it.
 */
export interface AgentSpawnSummary {
  count: number;
  working: number;
  failed: number;
  live: boolean;
  /**
   * Optional because Eva's sub-agent model carries no usage: `SubagentView` has
   * no token field and nothing upstream reports one. Only the mock summary sets
   * it, so real rows omit the `Σ` cluster entirely rather than render a zero.
   */
  totalTokens?: number;
}

/**
 * Folds one message's own activity log into a spawn summary. Returns null when
 * the turn spawned nothing, which is the row's render gate.
 *
 * `backgroundAgents` is entity-wide (every sub-agent the session ever ran), so
 * it is narrowed to the ids this turn actually spawned before it is folded in —
 * otherwise every turn's row would report the whole session's roster.
 */
export function deriveAgentSpawnSummary({
  activityLog,
  streamingActivity,
  backgroundAgents,
  sandboxRunning,
}: {
  activityLog?: string;
  streamingActivity?: string;
  backgroundAgents?: ReadonlyArray<BackgroundAgentEntry>;
  sandboxRunning?: boolean;
}): AgentSpawnSummary | null {
  const spawnedHere = deriveSubagents({
    activityLogs: [activityLog],
    streamingActivity,
  });
  if (spawnedHere.length === 0) return null;

  const ownIds = new Set(spawnedHere.map((agent) => agent.toolUseId));
  const roster = deriveSubagents({
    activityLogs: [activityLog],
    streamingActivity,
    backgroundAgents: (backgroundAgents ?? []).filter((entry) =>
      ownIds.has(entry.toolUseId),
    ),
    sandboxRunning,
  });

  let working = 0;
  let failed = 0;
  for (const agent of roster) {
    const tone = subagentTone(agent.status);
    if (tone === "active") working += 1;
    else if (tone === "danger") failed += 1;
  }
  return { count: roster.length, working, failed, live: working > 0 };
}

/**
 * Demo/screenshot override: `?mockAgents=1` renders this summary on the last
 * assistant turn, whatever that turn really did. The only path that shows the
 * `Σ` cluster — see {@link AgentSpawnSummary.totalTokens}.
 */
export const MOCK_AGENT_SPAWN_SUMMARY: AgentSpawnSummary = {
  count: 3,
  working: 1,
  failed: 0,
  live: true,
  totalTokens: 65_100,
};

const mockAgentsParser = parseAsString.withOptions({ history: "replace" });

/** True while `?mockAgents=1` (anything but absent / `0` / `false`) is set. */
export function useMockAgentsEnabled(): boolean {
  const [mockAgents] = useQueryState("mockAgents", mockAgentsParser);
  return mockAgents !== null && mockAgents !== "0" && mockAgents !== "false";
}

/**
 * Slim anchored row under an assistant turn that kicked off sub-agents. Live
 * status is a snapshot, not a roster: the dot never animates and the row's only
 * job is to hand the user to the Agents tab.
 */
export function AgentSpawnCtaRow({
  summary,
  onOpen,
}: {
  summary: AgentSpawnSummary;
  onOpen: () => void;
}) {
  const { count, working, failed, live, totalTokens } = summary;
  const plural = count === 1 ? "" : "s";
  const lead = live
    ? `Kicked off ${count} subagent${plural}`
    : `Ran ${count} subagent${plural}`;
  // One steady in-flight presentation: only settled states differentiate.
  const status = live
    ? working > 0
      ? `${working} working`
      : "working"
    : failed > 0
      ? `${failed} failed`
      : "completed";
  // Eva has no `info` colour token, so a live batch borrows `primary`.
  const dotClass = live
    ? "bg-primary"
    : failed > 0
      ? "bg-destructive"
      : "bg-success";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="motion-press mt-2 flex w-full items-center gap-2 rounded-surface border border-border bg-muted/30 px-2.5 py-1.5 text-left text-[13px] hover:bg-accent/50 active:scale-[0.99]"
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", dotClass)}
      />
      <IconRobot className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate font-medium">{lead}</span>
      <span className="ml-auto flex shrink-0 items-center gap-2 font-mono text-[.7rem] text-muted-foreground">
        <span className="flex items-center gap-1">
          {!live && failed === 0 ? (
            <IconCheck aria-hidden className="size-3 text-success" />
          ) : null}
          {status}
        </span>
        {totalTokens !== undefined && totalTokens > 0 ? (
          <span className="tabular-nums">Σ {formatTokens(totalTokens)}</span>
        ) : null}
        <span className="flex items-center text-primary">
          {live ? "Open Agents" : "View"}
          <IconChevronRight aria-hidden className="size-3" />
        </span>
      </span>
    </button>
  );
}
