import { useState, createElement } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@eva/backend";
import { Button, Input } from "@eva/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  RESERVED_APP_TAB_SLUGS,
  slugifyAppTabName,
} from "@/lib/utils/appTabSlug";
import { resolveTablerIcon } from "@/lib/utils/tablerIcon";
import { CustomTabRow } from "./_components/CustomTabRow";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";
import { SettingsField } from "@/lib/components/settings/SettingsField";
import { IconLayoutNavbar } from "@tabler/icons-react";

function TabIconPreview({ icon }: { icon: string }) {
  return createElement(resolveTablerIcon(icon), {
    className: "mb-2 h-4 w-4 shrink-0 text-muted-foreground",
  });
}

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

  const formError = validationError ?? submitError;

  return (
    <PageWrapper title="Tabs" comfortable>
      <div className="space-y-4">
        <SettingsSection
          title="Add a tab"
          description={
            <>
              Tabs open a service running inside this app's sandbox on a given
              port (for example Supabase Studio or the Convex dashboard), and
              appear in every session for this app. The icon is a{" "}
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
            </>
          }
          bodyClassName="space-y-2"
        >
          {/* The three fields sit on one row on wide screens and stack on
              mobile, so the icon preview trails the name it previews. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-1 items-end gap-2">
              <TabIconPreview icon={icon.trim()} />
              <div className="flex-1">
                <SettingsField label="Name">
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSubmitError(null);
                    }}
                    className="h-8 text-xs"
                    placeholder="Supabase"
                  />
                </SettingsField>
              </div>
            </div>
            <div className="sm:w-40">
              <SettingsField label="Icon">
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="h-8 font-mono text-xs"
                  placeholder="IconBolt"
                />
              </SettingsField>
            </div>
            <div className="sm:w-24">
              <SettingsField label="Port">
                <Input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="53432"
                />
              </SettingsField>
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
            <p className="text-xs text-muted-foreground">
              URL slug: <code>{slug}</code>
            </p>
          ) : null}
          {formError ? (
            <p className="text-xs text-destructive">{formError}</p>
          ) : null}
        </SettingsSection>

        <SettingsSection title="Custom tabs" bodyClassName="p-0">
          {tabs && tabs.length > 0 ? (
            <div className="divide-y divide-border">
              {tabs.map((tab) => (
                <CustomTabRow key={tab._id} tab={tab} takenSlugs={takenSlugs} />
              ))}
            </div>
          ) : (
            <SettingsEmptyState
              icon={IconLayoutNavbar}
              title="No custom tabs yet"
              description="Add one above to open a sandbox service in its own tab."
            />
          )}
        </SettingsSection>
      </div>
    </PageWrapper>
  );
}
