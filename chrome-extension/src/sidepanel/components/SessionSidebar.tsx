import { useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { IconPlus, IconX, IconMessage } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/chrome-extension";

interface SessionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  repoId: string;
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  afterSignOutUrl: string;
}

export function SessionSidebar({
  isOpen,
  onClose,
  repoId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  afterSignOutUrl,
}: SessionSidebarProps) {
  const { user } = useUser();
  const sessions = useQuery(
    api.sessions.list,
    repoId ? { repoId: repoId as Id<"githubRepos"> } : "skip"
  );

  if (!isOpen) return null;

  return (
    <>
      <div
        className="absolute inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r border-border z-50 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="font-medium text-sm">Sessions</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <IconX size={16} />
          </Button>
        </div>

        <div className="p-2">
          <Button
            size="default"
            className="w-full justify-start gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => {
              onNewSession();
              onClose();
            }}
          >
            <IconPlus size={16} />
            New Session
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions === undefined ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No sessions yet
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sessions.map((session) => (
                <button
                  key={session._id}
                  onClick={() => {
                    onSessionSelect(session._id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                    session._id === currentSessionId
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <IconMessage size={16} className="shrink-0 opacity-50" />
                  <span className="truncate">{session.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-3 border-t border-border">
          <UserButton afterSignOutUrl={afterSignOutUrl} />
          {user?.fullName && (
            <span className="text-sm text-foreground truncate">{user.fullName}</span>
          )}
        </div>
      </div>
    </>
  );
}
