"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@eva/backend";
import { Spinner, Switch } from "@eva/ui";
import { SettingsPage } from "@/lib/components/settings/SettingsPage";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsToggleRow } from "@/lib/components/settings/SettingsToggleRow";

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
      <SettingsPage title="Notifications">
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage title="Notifications">
      <SettingsSection
        title="Email notifications"
        description="How Eva reaches you outside the app."
        bodyVariant="list"
      >
        <SettingsToggleRow
          title="Send summary and changelog"
          description="Receive a daily summary of unread notifications and the weekly changelog by email."
          action={
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => setEnabled({ enabled: checked })}
              aria-label="Email notifications"
            />
          }
        />
      </SettingsSection>
    </SettingsPage>
  );
}
