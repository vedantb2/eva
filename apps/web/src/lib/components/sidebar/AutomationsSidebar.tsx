"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SearchInput,
  Spinner,
  cn,
} from "@conductor/ui";
import { IconPlayerPlay, IconPlus } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useQueryState } from "nuqs";
import { searchParser } from "@/lib/search-params";

interface AutomationsSidebarProps {
  repoId: Id<"githubRepos">;
  basePath: string;
  pathname: string;
  onNavigate?: () => void;
}

export function AutomationsSidebar({
  repoId,
  basePath,
  pathname,
  onNavigate,
}: AutomationsSidebarProps) {
  const navigate = useNavigate();
  const automations = useQuery(api.automations.list, { repoId });
  const createAutomation = useMutation(api.automations.create);

  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredAutomations = useMemo(() => {
    if (!automations) return [];
    const q = searchQuery.toLowerCase().trim();
    return q
      ? automations.filter((a) => a.title.toLowerCase().includes(q))
      : automations;
  }, [automations, searchQuery]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const id = await createAutomation({ repoId, title: newTitle.trim() });
      setNewTitle("");
      setIsCreateOpen(false);
      navigate({ to: `${basePath}/automations/${id}` });
      onNavigate?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 p-2">
        <SearchInput
          placeholder="Search automations..."
          value={searchQuery}
          onChange={(v) => setSearchQuery(v || null)}
          onClear={() => setSearchQuery(null)}
          className="min-w-0 flex-1"
          inputClassName="border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground placeholder:text-muted-foreground"
        />
        <Button
          size="icon-sm"
          variant="ghost"
          className="shrink-0 text-sidebar-primary"
          onClick={() => setIsCreateOpen(true)}
          title="New automation"
        >
          <IconPlus size={16} />
        </Button>
      </div>

      <div className="flex-1">
        {automations === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : automations.length === 0 ? (
          <div className="p-4 text-center">
            <IconPlayerPlay
              size={28}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">No automations yet</p>
          </div>
        ) : filteredAutomations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No matches found
          </div>
        ) : (
          <div>
            {filteredAutomations.map((automation) => {
              const href = `${basePath}/automations/${automation._id}`;
              const isSelected = pathname.startsWith(href);
              return (
                <div
                  key={automation._id}
                  className={cn(
                    "group mx-1 rounded-md px-3 py-3.5 transition-colors",
                    isSelected
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70",
                  )}
                >
                  <Link
                    to={href}
                    onClick={onNavigate}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "block flex-1 truncate text-sm",
                          isSelected && "font-medium text-sidebar-primary",
                        )}
                      >
                        {automation.title}
                      </span>
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          automation.enabled
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/30",
                        )}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dayjs(automation.updatedAt).fromNow()}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (isCreating) return;
          setIsCreateOpen(open);
          if (!open) setNewTitle("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Automation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., Update dependencies weekly"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim()) {
                    void handleCreate();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreateOpen(false);
                  setNewTitle("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !newTitle.trim()}
              >
                {isCreating ? <Spinner size="sm" /> : "Create"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
