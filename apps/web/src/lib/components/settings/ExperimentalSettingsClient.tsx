"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@eva/backend";
import { Spinner, Switch } from "@eva/ui";
import { SettingsPage } from "@/lib/components/settings/SettingsPage";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsToggleRow } from "@/lib/components/settings/SettingsToggleRow";

type ExperimentalFlagKey =
  | "sessionTabs"
  | "blurPid"
  | "voiceDictation"
  | "composerAutocomplete";

export function ExperimentalSettingsClient() {
  const flags = useQuery(api.auth.getExperimentalFlags);
  const setFlag = useMutation(api.auth.setExperimentalFlag).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.auth.getExperimentalFlags, {});
      if (current === undefined) return;
      localStore.setQuery(
        api.auth.getExperimentalFlags,
        {},
        { ...current, [args.key]: args.enabled },
      );
    },
  );

  const toggle = (key: ExperimentalFlagKey, enabled: boolean) => {
    void setFlag({ key, enabled });
  };

  if (flags === undefined) {
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
                checked={flags.sessionTabs}
                onCheckedChange={(checked) => toggle("sessionTabs", checked)}
                aria-label="Chrome-style session tabs"
              />
            }
          />
          <SettingsToggleRow
            title="Blur personal info"
            description="Blur names and emails when screen recording. Avatars stay visible."
            action={
              <Switch
                checked={flags.blurPid}
                onCheckedChange={(checked) => toggle("blurPid", checked)}
                aria-label="Blur personal info"
              />
            }
          />
          <SettingsToggleRow
            title="Voice dictation"
            description="Use speech-to-text in chat and quick tasks. Requires microphone permission."
            action={
              <Switch
                checked={flags.voiceDictation}
                onCheckedChange={(checked) =>
                  toggle("voiceDictation", checked)
                }
                aria-label="Voice dictation"
              />
            }
          />
          <SettingsToggleRow
            title="Composer autocomplete"
            description="Suggest inline completions while typing in chat and task composers. Press Tab to accept."
            action={
              <Switch
                checked={flags.composerAutocomplete}
                onCheckedChange={(checked) =>
                  toggle("composerAutocomplete", checked)
                }
                aria-label="Composer autocomplete"
              />
            }
          />
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
