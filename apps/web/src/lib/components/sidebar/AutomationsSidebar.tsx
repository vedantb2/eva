"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation, useConvex } from "convex/react";
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
import { useQueryState } from "nuqs";
import { searchParser } from "@/lib/search-params";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClass,
} from "@/lib/components/sidebar/SharedLayoutNav";
import {
  SidebarListHoverCard,
  sidebarTextPreview,
} from "@/lib/components/sidebar/SidebarListHoverCard";
import { entityPathSegment } from "@/lib/numId";

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
  const convex = useConvex();
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
      const created = await convex.query(api.automations.get, { id });
      const segment = created ? entityPathSegment(created) : null;
      if (!segment) return;
      setNewTitle("");
      setIsCreateOpen(false);
      navigate({ to: `${basePath}/automations/${segment}` });
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
          <SharedLayoutNav layoutId="automations-nav" className="space-y-1">
            {filteredAutomations.map((automation) => {
              const segment = entityPathSegment(automation);
              if (!segment) return null;
              const href = `${basePath}/automations/${segment}`;
              const isSelected = pathname.startsWith(href);
              return (
                <SharedLayoutNavSurface
                  key={automation._id}
                  itemId={automation._id}
                  isActive={isSelected}
                  className="group"
                >
                  <SidebarListHoverCard
                    title={automation.title}
                    preview={sidebarTextPreview(automation.description)}
                    updatedAt={automation.updatedAt}
                  >
                    <Link
                      to={href}
                      onClick={onNavigate}
                      className={sidebarNavLinkClass(isSelected)}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          automation.enabled
                            ? "bg-success"
                            : "bg-muted-foreground/30",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {automation.title}
                      </span>
                    </Link>
                  </SidebarListHoverCard>
                </SharedLayoutNavSurface>
              );
            })}
          </SharedLayoutNav>
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
