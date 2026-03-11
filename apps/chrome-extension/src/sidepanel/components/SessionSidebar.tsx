import { useState, useMemo } from "react";
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
  IconMessageCircle2,
} from "@tabler/icons-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTitle,
  SearchInput,
  Spinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import { UserButton, useUser } from "@clerk/chrome-extension";

type View = "sessions" | "designs";

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
  const [view, setView] = useState<View>("sessions");
  const [search, setSearch] = useState("");
  const [archivedOpen, setArchivedOpen] = useState(false);

  const sessions = useQuery(api.sessions.list, { repoId });
  const archivedSessions = useQuery(api.sessions.listArchived, { repoId });
  const archiveSession = useMutation(api.sessions.archive);
  const designSessions = useQuery(api.designSessions.list, { repoId });

  const query = search.toLowerCase().trim();

  const filteredSessions = useMemo(
    () => sessions?.filter((s) => s.title.toLowerCase().includes(query)) ?? [],
    [sessions, query],
  );

  const filteredArchived = useMemo(
    () =>
      archivedSessions?.filter((s) => s.title.toLowerCase().includes(query)) ??
      [],
    [archivedSessions, query],
  );

  const filteredDesigns = useMemo(
    () =>
      designSessions?.filter((d) => d.title.toLowerCase().includes(query)) ??
      [],
    [designSessions, query],
  );

  const handleSearchClear = () => setSearch("");

  const handleViewChange = (next: View) => {
    setView(next);
    setSearch("");
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="left" className="w-64 p-0" hideCloseButton>
        <div className="flex items-center h-14 px-4 shrink-0">
          <div className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5">
            <img
              src={chrome.runtime.getURL("icons/icon.png")}
              alt="Eva"
              width={30}
              height={30}
              className="rounded-lg"
            />
            <SheetTitle className="text-lg font-semibold tracking-[-0.02em] text-sidebar-primary">
              Eva
            </SheetTitle>
          </div>
        </div>

        <div className="flex gap-1 px-3 pb-2 shrink-0">
          <button
            onClick={() => handleViewChange("sessions")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "sessions"
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <IconMessage size={14} />
            Sessions
          </button>
          <button
            onClick={() => handleViewChange("designs")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "designs"
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <IconPalette size={14} />
            Designs
          </button>
        </div>

        <div className="px-3 pb-2 shrink-0">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={handleSearchClear}
            placeholder={
              view === "sessions" ? "Search sessions..." : "Search designs..."
            }
            className="max-w-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 scrollbar">
          {view === "sessions" && (
            <SessionsView
              sessions={filteredSessions}
              archivedSessions={filteredArchived}
              archivedOpen={archivedOpen}
              onToggleArchived={() => setArchivedOpen((p) => !p)}
              currentSessionId={currentSessionId}
              isLoading={sessions === undefined}
              onSelect={(id) => {
                onSessionSelect(id);
                onClose();
              }}
              onArchive={(id) => archiveSession({ id })}
            />
          )}
          {view === "designs" && (
            <DesignsView
              designs={filteredDesigns}
              isLoading={designSessions === undefined}
            />
          )}
        </div>

        <div className="px-3 py-3 border-t border-border shrink-0">
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

function SessionsView({
  sessions,
  archivedSessions,
  archivedOpen,
  onToggleArchived,
  currentSessionId,
  isLoading,
  onSelect,
  onArchive,
}: {
  sessions: Array<{ _id: Id<"sessions">; title: string }>;
  archivedSessions: Array<{ _id: Id<"sessions">; title: string }>;
  archivedOpen: boolean;
  onToggleArchived: () => void;
  currentSessionId: Id<"sessions"> | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: Id<"sessions">) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (sessions.length === 0 && archivedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IconMessageCircle2
          size={28}
          className="text-muted-foreground/30 mb-2"
        />
        <p className="text-xs text-muted-foreground">No sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {sessions.map((session) => (
        <div
          key={session._id}
          className={`flex items-center gap-1 rounded-lg text-sm transition-colors w-full group ${
            session._id === currentSessionId
              ? "bg-accent text-primary font-medium"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <button
            onClick={() => onSelect(session._id)}
            className="flex items-center gap-3 px-3 py-2 flex-1 min-w-0 text-left"
          >
            <IconMessage className="size-4 shrink-0" />
            <span className="truncate text-[13px]">{session.title}</span>
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(session._id);
                }}
                className="p-1 mr-1 rounded opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
              >
                <IconArchive size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
        </div>
      ))}

      {archivedSessions.length > 0 && (
        <div className="pt-2">
          <button
            onClick={onToggleArchived}
            className="flex items-center gap-1.5 py-1 w-full text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase hover:text-muted-foreground transition-colors"
          >
            Archived
            <span className="text-[10px] font-normal tabular-nums">
              ({archivedSessions.length})
            </span>
            <IconChevronDown
              className={`w-3 h-3 transition-transform ${archivedOpen ? "" : "-rotate-90"}`}
            />
          </button>
          {archivedOpen && (
            <div className="space-y-0.5 pt-0.5">
              {archivedSessions.map((session) => (
                <button
                  key={session._id}
                  onClick={() => onSelect(session._id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors w-full text-left text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground"
                >
                  <IconArchive className="size-4 shrink-0" />
                  <span className="truncate">{session.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DesignsView({
  designs,
  isLoading,
}: {
  designs: Array<{ _id: string; title: string }>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IconPalette size={28} className="text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No designs yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {designs.map((design) => (
        <button
          key={design._id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors w-full text-left text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <IconPalette className="size-4 shrink-0" />
          <span className="truncate">{design.title}</span>
        </button>
      ))}
    </div>
  );
}
