import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@conductor/ui";
import { IconX, IconFolder } from "@tabler/icons-react";

interface SessionItemProps {
  sessionId: string;
  name: string;
  tabCount: number;
  createdAt: number;
  onDelete: (sessionId: string) => void;
}

function relativeTime(ts: number): string {
  const delta = Date.now() - ts;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  return `${Math.floor(delta / 86_400_000)}d ago`;
}

export function SessionItem({
  sessionId,
  name,
  tabCount,
  createdAt,
  onDelete,
}: SessionItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === `/session/${sessionId}`;

  return (
    <div
      className={`group relative flex flex-col gap-0.5 px-2 py-2 rounded-md cursor-pointer transition-colors select-none ${
        isActive
          ? "bg-accent text-foreground"
          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
      }`}
      onClick={() => navigate(`/session/${sessionId}`)}
    >
      <div className="flex items-center gap-1.5 min-w-0 pr-5">
        <IconFolder size={12} className="shrink-0 text-muted-foreground" />
        <span className="text-xs font-medium truncate flex-1">{name}</span>
        <span className="text-[10px] text-muted-foreground/70 shrink-0">
          {relativeTime(createdAt)}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground truncate pl-[18px] pr-5">
        {tabCount} tab{tabCount !== 1 ? "s" : ""}
      </p>
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-1 top-1 h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(sessionId);
        }}
      >
        <IconX size={10} />
      </Button>
    </div>
  );
}
