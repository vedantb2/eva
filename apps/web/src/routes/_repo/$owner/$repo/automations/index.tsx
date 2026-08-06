import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { OptimisticLocalStore } from "convex/browser";
import { Skeleton, toast } from "@eva/ui";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SystemAutomationCard } from "./_components/SystemAutomationCard";

/**
 * Flips `installed` in the Hub list so the card switches over before the server
 * round-trip. `numId` waits for the real row.
 */
function patchInstalled(installed: boolean) {
  return (
    localStore: OptimisticLocalStore,
    args: { repoId: Id<"githubRepos">; key: string },
  ) => {
    const queryArgs = { repoId: args.repoId };
    const current = localStore.getQuery(
      api.automations.listSystemAutomations,
      queryArgs,
    );
    if (current === undefined) return;
    localStore.setQuery(
      api.automations.listSystemAutomations,
      queryArgs,
      current.map((entry) =>
        entry.key === args.key
          ? {
              ...entry,
              installed,
              enabled: installed,
              numId: installed ? entry.numId : null,
            }
          : entry,
      ),
    );
  };
}

export const Route = createFileRoute("/_repo/$owner/$repo/automations/")({
  staticData: { title: "Automations" },
  component: AutomationsHubPage,
});

/**
 * Automations Hub: the eva-managed automation catalog for this app. Installing
 * one adds it to the app's automations; the definition stays owned by eva.
 */
function AutomationsHubPage() {
  const { repoId, basePath } = useRepo();
  const systemAutomations = useQuery(api.automations.listSystemAutomations, {
    repoId,
  });

  const install = useMutation(
    api.automations.installSystemAutomation,
  ).withOptimisticUpdate(patchInstalled(true));
  const uninstall = useMutation(
    api.automations.uninstallSystemAutomation,
  ).withOptimisticUpdate(patchInstalled(false));

  return (
    <PageWrapper comfortable title="Automations">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          Automations built into eva. Install one to add it to this app; its
          prompt and schedule stay managed by eva.
        </p>

        {systemAutomations === undefined ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {systemAutomations.map((entry) => (
              <SystemAutomationCard
                key={entry.key}
                title={entry.title}
                description={entry.description}
                cronSchedule={entry.cronSchedule}
                installed={entry.installed}
                numId={entry.numId}
                basePath={basePath}
                onInstall={() => {
                  void install({ repoId, key: entry.key }).catch(() =>
                    toast.error("Couldn't install automation", {
                      id: "system-automation-install",
                    }),
                  );
                }}
                onUninstall={() => {
                  void uninstall({ repoId, key: entry.key }).catch(() =>
                    toast.error("Couldn't uninstall automation", {
                      id: "system-automation-install",
                    }),
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
