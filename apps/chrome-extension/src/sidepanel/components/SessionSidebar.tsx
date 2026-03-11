import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  IconMessage,
  IconChevronDown,
  IconPalette,
  IconSun,
  IconMoon,
  IconArchive,
} from "@tabler/icons-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTitle,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import { UserButton, useUser } from "@clerk/chrome-extension";

interface SessionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  repoId: Id<"githubRepos">;
  currentSessionId: Id<"sessions"> | null;
  onSessionSelect: (sessionId: string) => void;
  afterSignOutUrl: string;
  theme: string;
  onToggleTheme: () => void;
}

export function SessionSidebar({
  isOpen,
  onClose,
  repoId,
  currentSessionId,
  onSessionSelect,
  afterSignOutUrl,
  theme,
  onToggleTheme,
}: SessionSidebarProps) {
  const { user } = useUser();
  const [expandedSections, setExpandedSections] = useState(
    new Set(["Sessions", "Designs"]),
  );

  const sessions = useQuery(api.sessions.list, { repoId });
  const archivedSessions = useQuery(api.sessions.listArchived, { repoId });
  const archiveSession = useMutation(api.sessions.archive);

  const designSessions = useQuery(api.designSessions.list, { repoId });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="left" className="w-64 p-0" hideCloseButton>
        <div className="flex items-center h-14 px-4">
          <div className="flex items-center gap-1.5 bg-accent rounded-full pr-4">
            <img
              src={chrome.runtime.getURL("icons/icon.png")}
              alt="Eva"
              width={30}
              height={30}
              className="rounded-full"
            />
            <SheetTitle className="text-xl tracking-tight font-semibold text-primary">
              Eva
            </SheetTitle>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pt-2">
          <div>
            <button
              onClick={() => toggleSection("Sessions")}
              className="flex items-center gap-1.5 py-0.5 mb-1 w-full text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase hover:text-muted-foreground transition-colors"
            >
              Sessions
              <IconChevronDown
                className={`w-3 h-3 transition-transform ${expandedSections.has("Sessions") ? "" : "-rotate-90"}`}
              />
            </button>
            {expandedSections.has("Sessions") && (
              <div className="space-y-0.5 pl-2">
                {sessions === undefined ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Loading...
                  </p>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No sessions yet
                  </p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session._id}
                      className={`flex items-center gap-1 rounded-lg text-sm transition-colors w-full group ${
                        session._id === currentSessionId
                          ? "bg-accent text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSessionSelect(session._id);
                          onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0 text-left"
                      >
                        <IconMessage className="size-4 shrink-0" />
                        <span className="truncate">{session.title}</span>
                      </button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveSession({ id: session._id });
                            }}
                            className="p-1 mr-1 rounded opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <IconArchive size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Archive</TooltipContent>
                      </Tooltip>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {archivedSessions && archivedSessions.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => toggleSection("Archived")}
                className="flex items-center gap-1.5 py-0.5 mb-1 w-full text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase hover:text-muted-foreground transition-colors"
              >
                Archived
                <IconChevronDown
                  className={`w-3 h-3 transition-transform ${expandedSections.has("Archived") ? "" : "-rotate-90"}`}
                />
              </button>
              {expandedSections.has("Archived") && (
                <div className="space-y-0.5 pl-2">
                  {archivedSessions.map((session) => (
                    <button
                      key={session._id}
                      onClick={() => {
                        onSessionSelect(session._id);
                        onClose();
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground"
                    >
                      <IconArchive className="size-4 shrink-0" />
                      <span className="truncate">{session.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-3">
            <button
              onClick={() => toggleSection("Designs")}
              className="flex items-center gap-1.5 py-0.5 mb-1 w-full text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase hover:text-muted-foreground transition-colors"
            >
              Designs
              <IconChevronDown
                className={`w-3 h-3 transition-transform ${expandedSections.has("Designs") ? "" : "-rotate-90"}`}
              />
            </button>
            {expandedSections.has("Designs") && (
              <div className="space-y-0.5 pl-2">
                {designSessions === undefined ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Loading...
                  </p>
                ) : designSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No designs yet
                  </p>
                ) : (
                  designSessions.map((design) => (
                    <button
                      key={design._id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    >
                      <IconPalette className="size-4 shrink-0" />
                      <span className="truncate">{design.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl={afterSignOutUrl} />
            <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
              {user?.fullName || "User"}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleTheme}>
                  {theme === "dark" ? (
                    <IconSun size={16} />
                  ) : (
                    <IconMoon size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
