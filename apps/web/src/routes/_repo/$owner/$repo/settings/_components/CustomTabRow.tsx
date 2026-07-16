"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Doc } from "@conductor/backend";
import { Button, Input, cn } from "@conductor/ui";
import { IconTrash } from "@tabler/icons-react";
import {
  RESERVED_APP_TAB_SLUGS,
  slugifyAppTabName,
} from "@/lib/utils/appTabSlug";
import { resolveTablerIcon } from "@/lib/utils/tablerIcon";

interface CustomTabRowProps {
  tab: Doc<"appTabs">;
  /** Slugs already used by other tabs in this app (includes this tab's slug). */
  takenSlugs: ReadonlySet<string>;
}

/**
 * One editable custom-tab row. Fields are uncontrolled (defaultValue + onBlur):
 * each blur patches its own field while sourcing the untouched fields from the
 * live query row — no draft state mirrored from Convex.
 */
export function CustomTabRow({ tab, takenSlugs }: CustomTabRowProps) {
  const update = useMutation(api.appTabs.update);
  const toggleEnabled = useMutation(api.appTabs.toggleEnabled);
  const remove = useMutation(api.appTabs.remove);
  const [nameError, setNameError] = useState<string | null>(null);

  const Icon = resolveTablerIcon(tab.icon);
  const ownSlug = slugifyAppTabName(tab.name);

  const handleNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.value.trim();
    if (!name || name === tab.name) {
      setNameError(null);
      e.target.value = tab.name;
      return;
    }
    const slug = slugifyAppTabName(name);
    if (!slug) {
      setNameError("Name must contain letters or numbers");
      e.target.value = tab.name;
      return;
    }
    if (RESERVED_APP_TAB_SLUGS.has(slug)) {
      setNameError(`"${name}" is reserved for a built-in tab`);
      e.target.value = tab.name;
      return;
    }
    if (slug !== ownSlug && takenSlugs.has(slug)) {
      setNameError("A tab with this name already exists");
      e.target.value = tab.name;
      return;
    }
    try {
      await update({ id: tab._id, name, icon: tab.icon, port: tab.port });
      setNameError(null);
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Failed to update name",
      );
      e.target.value = tab.name;
    }
  };

  const handleIconBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const icon = e.target.value.trim();
    if (!icon || icon === tab.icon) return;
    update({ id: tab._id, name: tab.name, icon, port: tab.port });
  };

  const handlePortBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const port = parseInt(e.target.value.trim(), 10);
    if (Number.isNaN(port) || port <= 0 || port > 65535 || port === tab.port) {
      return;
    }
    update({ id: tab._id, name: tab.name, icon: tab.icon, port });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 rounded-surface border border-border bg-card p-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          key={`name-${tab._id}-${tab.name}`}
          defaultValue={tab.name}
          onBlur={handleNameBlur}
          className="h-8 flex-1 text-xs"
          placeholder="Name"
        />
        <Input
          key={`icon-${tab._id}`}
          defaultValue={tab.icon}
          onBlur={handleIconBlur}
          className="h-8 w-40 text-xs font-mono"
          placeholder="IconBolt"
        />
        <Input
          key={`port-${tab._id}`}
          type="number"
          defaultValue={tab.port}
          onBlur={handlePortBlur}
          className="h-8 w-24 text-xs"
          placeholder="Port"
        />
        <button
          type="button"
          aria-label={tab.enabled ? "Disable tab" : "Enable tab"}
          onClick={() => toggleEnabled({ id: tab._id, enabled: !tab.enabled })}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            tab.enabled ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-full bg-white transition-transform",
              tab.enabled ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-destructive hover:bg-destructive/10"
          aria-label="Delete tab"
          onClick={() => remove({ id: tab._id })}
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>
      {nameError ? (
        <p className="px-2 text-[11px] text-destructive">{nameError}</p>
      ) : (
        <p className="px-2 text-[11px] text-muted-foreground">
          URL slug: <code>{ownSlug}</code>
        </p>
      )}
    </div>
  );
}
