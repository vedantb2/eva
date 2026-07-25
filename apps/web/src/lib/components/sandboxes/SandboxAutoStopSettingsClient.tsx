"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Checkbox, Input, Spinner } from "@eva/ui";

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
      <label className="flex cursor-pointer items-start gap-3 rounded-surface bg-muted/40 p-4 transition-colors hover:bg-muted/60">
        <Checkbox
          className="mt-0.5"
          checked={settings.enabled}
          onCheckedChange={(checked) =>
            save({
              enabled: checked === true,
              time: settings.time,
              timeZone: browserTimeZone,
            })
          }
        />
        <div>
          <h3 className="text-sm font-medium">Daily auto-stop</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Stop every running sandbox at a set time each day so none are left
            running overnight. Applies to all sandboxes across the app.
          </p>
        </div>
      </label>

      {settings.enabled && (
        <div className="mt-4 rounded-surface bg-muted/40 p-4">
          <h3 className="text-sm font-medium">Stop time</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Sandboxes stop at this time in {settings.timeZone}. The sweep runs
            within 15 minutes of the set time.
          </p>
          <Input
            type="time"
            className="mt-3 w-40"
            value={settings.time}
            onChange={(event) =>
              save({
                enabled: settings.enabled,
                time: event.target.value,
                timeZone: browserTimeZone,
              })
            }
          />
        </div>
      )}
    </PageWrapper>
  );
}
