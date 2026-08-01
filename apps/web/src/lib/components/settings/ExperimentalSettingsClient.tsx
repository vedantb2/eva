import { useQuery, useMutation } from "convex/react";
import { api } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner, Switch } from "@eva/ui";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";

export function ExperimentalSettingsClient() {
  const enabled = useQuery(api.auth.getExperimentalSessionTabsEnabled);
  const setEnabled = useMutation(
    api.auth.setExperimentalSessionTabsEnabled,
  ).withOptimisticUpdate((localStore, args) => {
    localStore.setQuery(
      api.auth.getExperimentalSessionTabsEnabled,
      {},
      args.enabled,
    );
  });

  const blurPid = useQuery(api.auth.getBlurPidEnabled);
  const setBlurPid = useMutation(
    api.auth.setBlurPidEnabled,
  ).withOptimisticUpdate((localStore, args) => {
    localStore.setQuery(api.auth.getBlurPidEnabled, {}, args.enabled);
  });

  if (enabled === undefined || blurPid === undefined) {
    return (
      <PageWrapper title="Experimental" comfortable>
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Experimental" comfortable>
      <div className="space-y-4">
        <SettingsSection
          title="Chrome-style session tabs"
          description="Replace the sessions sidebar with a horizontal tab strip grouped by app. Active sessions stay as tabs; archived and merged/closed PRs move into an Archived menu. Off by default."
          action={
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => setEnabled({ enabled: checked })}
              aria-label="Chrome-style session tabs"
            />
          }
        />
        <SettingsSection
          title="Blur personal info"
          description="Blur user names and email addresses across the app. Useful when screen recording. Avatars stay visible so you can still tell people apart. Off by default."
          action={
            <Switch
              checked={blurPid}
              onCheckedChange={(checked) => setBlurPid({ enabled: checked })}
              aria-label="Blur personal info"
            />
          }
        />
      </div>
    </PageWrapper>
  );
}
