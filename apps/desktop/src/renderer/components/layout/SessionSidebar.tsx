import { useNavigate, NavLink } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@conductor/ui";
import { IconPlus, IconSettings } from "@tabler/icons-react";
import { useSessionContext } from "../../contexts/SessionContext";
import { SessionItem } from "../sessions/SessionItem";

export function SessionSidebar() {
  const navigate = useNavigate();
  const { sessions, deleteSession } = useSessionContext();

  async function handleDelete(sessionId: string) {
    await deleteSession(sessionId);
    navigate("/");
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-border h-full bg-background">
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

      <div className="flex-1 overflow-y-auto px-1 py-1">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10 px-3">
            No sessions yet.
            <br />
            Start a new one above.
          </p>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.sessionId}
              sessionId={session.sessionId}
              name={session.name}
              tabCount={session.tabs.length}
              createdAt={session.createdAt}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

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
