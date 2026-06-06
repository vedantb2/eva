"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Checkbox, Spinner } from "@conductor/ui";

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
      <label className="flex cursor-pointer items-start gap-3 rounded-surface border border-border bg-card p-4 transition-colors hover:bg-muted/60">
        <Checkbox
          className="mt-0.5"
          checked={enabled}
          onCheckedChange={(checked) =>
            setEnabled({ enabled: checked === true })
          }
        />
        <div>
          <h3 className="text-sm font-medium">Email notifications</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Receive a daily summary of your unread notifications and the weekly
            changelog by email. Off by default.
          </p>
        </div>
      </label>
    </PageWrapper>
  );
}
