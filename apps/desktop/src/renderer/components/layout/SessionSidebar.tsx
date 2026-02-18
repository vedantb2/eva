import { useNavigate, NavLink } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@conductor/ui";
import { IconPlus, IconSettings } from "@tabler/icons-react";
import type { AgentInfo } from "../../../preload/types";
import { SessionItem } from "../agents/SessionItem";

interface SessionSidebarProps {
  agents: AgentInfo[];
  onKill: (agentId: string) => void;
}

export function SessionSidebar({ agents, onKill }: SessionSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-border h-screen bg-background">
      {/* Drag region + title */}
      <div
        className="h-10 shrink-0 flex items-center px-3 gap-2"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span
          className="text-sm font-semibold text-foreground select-none"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          EvaCode
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="ml-auto h-6 w-6 text-muted-foreground hover:text-foreground"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          onClick={() => navigate("/")}
          title="New session"
        >
          <IconPlus size={13} />
        </Button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {agents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10 px-3">
            No sessions yet.
            <br />
            Start a new one above.
          </p>
        ) : (
          agents.map((agent) => (
            <SessionItem key={agent.agentId} agent={agent} onKill={onKill} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2 flex items-center gap-2 shrink-0">
        <UserButton />
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `ml-auto p-1.5 rounded-md transition-colors ${
              isActive
                ? "text-foreground bg-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`
          }
          title="Settings"
        >
          <IconSettings size={16} />
        </NavLink>
      </div>
    </aside>
  );
}
