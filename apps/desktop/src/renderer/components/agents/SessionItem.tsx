import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@conductor/ui";
import { IconX } from "@tabler/icons-react";
import type { AgentInfo, AgentStatus } from "../../../preload/types";

interface SessionItemProps {
  agent: AgentInfo;
  onKill: (agentId: string) => void;
}

const STATUS_DOT: Record<AgentStatus, string> = {
  running: "bg-green-500",
  idle: "bg-muted-foreground",
  success: "bg-muted-foreground/50",
  error: "bg-red-500",
  killed: "bg-muted-foreground/50",
};

function relativeTime(ts: number): string {
  const delta = Date.now() - ts;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  return `${Math.floor(delta / 86_400_000)}d ago`;
}

export function SessionItem({ agent, onKill }: SessionItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === `/agent/${agent.agentId}`;

  return (
    <div
      className={`group relative flex flex-col gap-0.5 px-2 py-2 rounded-md cursor-pointer transition-colors select-none ${
        isActive
          ? "bg-accent text-foreground"
          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
      }`}
      onClick={() => navigate(`/agent/${agent.agentId}`)}
    >
      <div className="flex items-center gap-1.5 min-w-0 pr-5">
        <span
          className={`size-1.5 rounded-full shrink-0 ${STATUS_DOT[agent.status]}`}
        />
        <span className="text-xs font-mono truncate flex-1">
          {agent.branchName}
        </span>
        <span className="text-[10px] text-muted-foreground/70 shrink-0">
          {relativeTime(agent.startedAt)}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground truncate pl-3 pr-5">
        {agent.prompt.split("\n")[0]}
      </p>
      {agent.status === "running" && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1 h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            window.electronAPI.agentKill(agent.agentId).catch(() => null);
            onKill(agent.agentId);
          }}
        >
          <IconX size={10} />
        </Button>
      )}
    </div>
  );
}
