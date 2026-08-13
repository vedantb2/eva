"use client";

import { useQuery, useMutation } from "convex/react";
import { api, PERSONALISATION_PRESETS } from "@eva/backend";
import { SettingsPage } from "@/lib/components/settings/SettingsPage";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import {
  Textarea,
  Button,
  Spinner,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@eva/ui";
import { useEffect, useRef } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { RolePresetPicker } from "./RolePresetPicker";

export function PersonalisationClient() {
  const personalisation = useQuery(api.auth.getPersonalisation);
  const setCustomInstructions = useMutation(
    api.auth.setCustomInstructions,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.auth.getPersonalisation, {});
    if (current) {
      localStore.setQuery(
        api.auth.getPersonalisation,
        {},
        {
          ...current,
          customInstructions: args.customInstructions,
        },
      );
    }
  });
  const setRole = useMutation(api.auth.setRole).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.auth.getPersonalisation, {});
      if (current) {
        localStore.setQuery(
          api.auth.getPersonalisation,
          {},
          {
            ...current,
            role: args.role,
          },
        );
      }
    },
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedValue = personalisation?.customInstructions ?? "";

  const handleSave = async () => {
    const value = textareaRef.current?.value ?? "";
    await setCustomInstructions({ customInstructions: value });
  };

  useEffect(() => {
    if (textareaRef.current && personalisation) {
      textareaRef.current.value = personalisation.customInstructions ?? "";
    }
  }, [personalisation]);

  if (!personalisation) {
    return (
      <SettingsPage title="Personalisation">
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </SettingsPage>
    );
  }

  const activeRole = personalisation.role;

  return (
    <SettingsPage title="Personalisation">
      <SettingsSection
        title="Role preset"
        description="How Eva talks to you. Does not change what code it edits."
      >
        <div className="space-y-3">
          <RolePresetPicker
            activeRole={activeRole}
            onSelect={(role) => setRole({ role })}
          />

          {activeRole ? (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                View preset prompt
                <IconChevronDown className="size-3.5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 whitespace-pre-wrap rounded-control bg-muted p-3 font-mono text-xs leading-relaxed text-foreground/80">
                  {PERSONALISATION_PRESETS[activeRole].prompt}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <p className="text-xs text-muted-foreground">
              No preset selected.
            </p>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Custom instructions"
        description="Extra guidance included in every session."
        footer={
          <Button size="sm" onClick={handleSave}>
            Save instructions
          </Button>
        }
      >
        <Textarea
          ref={textareaRef}
          className="min-h-[160px] font-mono text-xs"
          placeholder="e.g. Explain changes in plain English before showing code"
          defaultValue={savedValue}
        />
      </SettingsSection>
    </SettingsPage>
  );
}
