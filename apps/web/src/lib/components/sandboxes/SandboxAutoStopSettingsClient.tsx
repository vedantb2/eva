"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Input, Spinner, Switch } from "@eva/ui";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";

/**
 * App-wide setting for the daily sandbox auto-stop sweep. The entered time is
 * interpreted in the browser's timezone (captured on save), so it reads as the
 * user's local time and a backend cron stops every running sandbox at that time
 * each day. Binds directly to the Convex query with an optimistic update — no
 * local form state.
 */
export function SandboxAutoStopSettingsClient() {
  const settings = useQuery(api.sandboxAutoStop.getSandboxAutoStopSettings);
  const save = useMutation(
    api.sandboxAutoStop.setSandboxAutoStopSettings,
  ).withOptimisticUpdate((localStore, args) => {
    localStore.setQuery(
      api.sandboxAutoStop.getSandboxAutoStopSettings,
      {},
      { enabled: args.enabled, time: args.time, timeZone: args.timeZone },
    );
  });

  if (settings === undefined) {
    return (
      <PageWrapper title="Sandboxes" comfortable>
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </PageWrapper>
    );
  }

  // The browser's IANA zone, stored on save so the entered time stays correct
  // across daylight-saving transitions.
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <PageWrapper title="Sandboxes" comfortable>
      <div className="space-y-4">
        <SettingsSection
          title="Daily auto-stop"
          description="Stop every running sandbox at a set time each day so none are left running overnight. Applies to all sandboxes across the app."
          action={
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                save({
                  enabled: checked,
                  time: settings.time,
                  timeZone: browserTimeZone,
                })
              }
              aria-label="Daily auto-stop"
            />
          }
        />

        {settings.enabled && (
          <SettingsSection
            title="Stop time"
            description={`Sandboxes stop at this time in ${settings.timeZone}. The sweep runs within 15 minutes of the set time.`}
          >
            <Input
              type="time"
              className="w-40"
              value={settings.time}
              onChange={(event) =>
                save({
                  enabled: settings.enabled,
                  time: event.target.value,
                  timeZone: browserTimeZone,
                })
              }
            />
          </SettingsSection>
        )}
      </div>
    </PageWrapper>
  );
}
