"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { Button, Input } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  RESERVED_APP_TAB_SLUGS,
  slugifyAppTabName,
} from "@/lib/utils/appTabSlug";
import { resolveTablerIcon } from "@/lib/utils/tablerIcon";
import { CustomTabRow } from "./_components/CustomTabRow";

function nameError(
  name: string,
  takenSlugs: ReadonlySet<string>,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = slugifyAppTabName(trimmed);
  if (!slug) return "Name must contain letters or numbers";
  if (RESERVED_APP_TAB_SLUGS.has(slug)) {
    return `"${trimmed}" is reserved for a built-in tab`;
  }
  if (takenSlugs.has(slug)) {
    return "A tab with this name already exists";
  }
  return null;
}

export function TabsSettingsClient() {
  const { repoId } = useRepo();
  const tabs = useQuery(api.appTabs.list, { repoId });
  const create = useMutation(api.appTabs.create);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [port, setPort] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const takenSlugs = (() => {
    const set = new Set<string>();
    for (const tab of tabs ?? []) {
      set.add(slugifyAppTabName(tab.name));
    }
    return set;
  })();

  const parsedPort = parseInt(port.trim(), 10);
  const portValid =
    !Number.isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535;
  const validationError = nameError(name, takenSlugs);
  const slug = slugifyAppTabName(name);
  const canAdd =
    name.trim() !== "" &&
    icon.trim() !== "" &&
    portValid &&
    validationError === null;

  async function handleAdd() {
    if (!canAdd) return;
    setSubmitError(null);
    try {
      await create({
        repoId,
        name: name.trim(),
        icon: icon.trim(),
        port: parsedPort,
        enabled: true,
      });
      setName("");
      setIcon("");
      setPort("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add tab");
    }
  }

  const PreviewIcon = resolveTablerIcon(icon.trim());
  const formError = validationError ?? submitError;

  return (
    <PageWrapper title="Tabs" comfortable>
      <div className="space-y-4">
        <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
          <div>
            <h3 className="text-sm font-medium">Custom Tabs</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Add tabs that open a service running inside this app's sandbox on
              a given port (for example Supabase Studio or the Convex
              dashboard). They appear in every session for this app. The icon is
              a{" "}
              <a
                href="https://tabler.io/icons"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Tabler icon
              </a>{" "}
              name such as <code>IconBolt</code>. Names must be unique (case
              insensitive) and become the session URL slug (e.g.{" "}
              <code>supabase</code>).
            </p>
          </div>

          <div className="flex items-end gap-2">
            <PreviewIcon className="mb-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSubmitError(null);
                }}
                className="h-8 text-xs"
                placeholder="Supabase"
              />
            </div>
            <div className="w-40">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Icon
              </label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="IconBolt"
              />
            </div>
            <div className="w-24">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Port
              </label>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="h-8 text-xs"
                placeholder="53432"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              Add
            </Button>
          </div>
          {slug && !validationError ? (
            <p className="text-[11px] text-muted-foreground">
              URL slug: <code>{slug}</code>
            </p>
          ) : null}
          {formError ? (
            <p className="text-[11px] text-destructive">{formError}</p>
          ) : null}
        </div>

        {tabs && tabs.length > 0 ? (
          <div className="space-y-2">
            {tabs.map((tab) => (
              <CustomTabRow key={tab._id} tab={tab} takenSlugs={takenSlugs} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No custom tabs yet. Add one above.
          </p>
        )}
      </div>
    </PageWrapper>
  );
}
