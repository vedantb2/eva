import { useQuery } from "convex/react";
import { api } from "conductor-backend";
import type { Id } from "conductor-backend";
import { IconPlus, IconMessage } from "@tabler/icons-react";
import { Button, Dialog, DialogContent, DialogTitle } from "@conductor/ui";
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
    repoId ? { repoId: repoId as Id<"githubRepos"> } : "skip",
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="fixed left-0 top-0 h-full w-64 translate-x-0 translate-y-0 rounded-none border-r border-border p-0 flex flex-col data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <DialogTitle className="font-medium text-sm">Sessions</DialogTitle>
        </div>

        <div className="p-2">
          <Button
            size="default"
            className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
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
            <span className="text-sm text-foreground truncate">
              {user.fullName}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
