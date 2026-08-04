"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@eva/backend";
import { Spinner, Switch } from "@eva/ui";
import { SettingsPage } from "@/lib/components/settings/SettingsPage";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsToggleRow } from "@/lib/components/settings/SettingsToggleRow";

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

  const voiceDictation = useQuery(api.auth.getVoiceDictationEnabled);
  const setVoiceDictation = useMutation(
    api.auth.setVoiceDictationEnabled,
  ).withOptimisticUpdate((localStore, args) => {
    localStore.setQuery(api.auth.getVoiceDictationEnabled, {}, args.enabled);
  });

  if (enabled === undefined || voiceDictation === undefined) {
    return (
      <SettingsPage title="Experimental">
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage title="Experimental">
      <SettingsSection
        title="Flags"
        description="Optional features. Off by default until you turn them on."
        bodyVariant="list"
      >
        <div className="divide-y divide-border">
          <SettingsToggleRow
            title="Chrome-style session tabs"
            description="Use horizontal tabs grouped by app. Archived and merged PRs move into an Archived menu."
            action={
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => setEnabled({ enabled: checked })}
                aria-label="Chrome-style session tabs"
              />
            }
          />
          <SettingsToggleRow
            title="Voice dictation"
            description="Use speech-to-text in chat and quick tasks. Requires microphone permission."
            action={
              <Switch
                checked={voiceDictation}
                onCheckedChange={(checked) =>
                  setVoiceDictation({ enabled: checked })
                }
                aria-label="Voice dictation"
              />
            }
          />
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
