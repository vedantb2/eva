"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation, useConvex } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Spinner,
  cn,
} from "@eva/ui";
import { IconPlayerPlay, IconPlus } from "@tabler/icons-react";
import { ContextSidebarHeaderIconButton } from "@/lib/components/sidebar/ContextSidebarHeaderAction";
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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const id = await createAutomation({ repoId, title: newTitle.trim() });
      const created = await convex.query(api.automations.get, { id });
      // Guarded with an if rather than a ternary: React Compiler bails on the
      // whole file when a conditional expression sits inside a try/catch.
      if (!created) {
        setIsCreating(false);
        return;
      }
      const segment = entityPathSegment(created);
      if (!segment) {
        setIsCreating(false);
        return;
      }
      setNewTitle("");
      setIsCreateOpen(false);
      navigate({ to: `${basePath}/automations/${segment}` });
      if (onNavigate) onNavigate();
    } catch (error) {
      setIsCreating(false);
      throw error;
    }
    setIsCreating(false);
  };

  return (
    <>
      <ContextSidebarHeaderIconButton
        title="New automation"
        icon={IconPlus}
        onClick={() => setIsCreateOpen(true)}
      />

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
        ) : (
          <SharedLayoutNav layoutId="automations-nav" className="space-y-1">
            {automations.map((automation) => {
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
                    userId={automation.createdBy}
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
