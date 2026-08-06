import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { Skeleton, toast } from "@eva/ui";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SystemAutomationCard } from "./_components/SystemAutomationCard";

export const Route = createFileRoute("/_repo/$owner/$repo/automations/")({
  staticData: { title: "Automations" },
  component: AutomationsHubPage,
});

/**
 * Automations Hub: the eva-managed automation catalog for this app. Definitions
 * are hardcoded in the backend, so users can only switch them on or off here.
 */
function AutomationsHubPage() {
  const { repoId, basePath } = useRepo();
  const systemAutomations = useQuery(api.automations.listSystemAutomations, {
    repoId,
  });
  const setState = useMutation(
    api.automations.setSystemAutomationState,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.automations.listSystemAutomations, {
      repoId: args.repoId,
    });
    if (current === undefined) return;
    localStore.setQuery(
      api.automations.listSystemAutomations,
      { repoId: args.repoId },
      current.map((entry) =>
        entry.key === args.key ? { ...entry, enabled: args.enabled } : entry,
      ),
    );
  });

  return (
    <PageWrapper comfortable title="Automations">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          Automations built into eva. Enable one to run it on its schedule for
          this app; its prompt and schedule stay managed by eva.
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
                enabled={entry.enabled}
                numId={entry.numId}
                basePath={basePath}
                onToggle={(next) => {
                  void setState({
                    repoId,
                    key: entry.key,
                    enabled: next,
                  }).catch(() =>
                    toast.error("Couldn't update automation", {
                      id: "system-automation-toggle",
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
