import { useQuery, useMutation } from "convex/react";
import { api } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner, Switch } from "@eva/ui";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";

export function NotificationsSettingsClient() {
  const enabled = useQuery(api.auth.getEmailNotificationsEnabled);
  const setEnabled = useMutation(
    api.auth.setEmailNotificationsEnabled,
  ).withOptimisticUpdate((localStore, args) => {
    localStore.setQuery(
      api.auth.getEmailNotificationsEnabled,
      {},
      args.enabled,
    );
  });

  if (enabled === undefined) {
    return (
      <PageWrapper title="Notifications" comfortable>
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Notifications" comfortable>
      <div className="space-y-4">
        <SettingsSection
          title="Email notifications"
          description="Receive a daily summary of your unread notifications and the weekly changelog by email. Off by default."
          action={
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => setEnabled({ enabled: checked })}
              aria-label="Email notifications"
            />
          }
        />
      </div>
    </PageWrapper>
  );
}
