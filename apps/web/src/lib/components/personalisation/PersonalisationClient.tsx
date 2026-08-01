import { useQuery, useMutation } from "convex/react";
import { api, PERSONALISATION_PRESETS } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { Textarea, Button, Spinner } from "@eva/ui";
import { useEffect, useRef } from "react";
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

  // Sync textarea value when server data loads
  useEffect(() => {
    if (textareaRef.current && personalisation) {
      textareaRef.current.value = personalisation.customInstructions ?? "";
    }
  }, [personalisation]);

  if (!personalisation) {
    return (
      <PageWrapper title="Personalisation" comfortable>
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </PageWrapper>
    );
  }

  const activeRole = personalisation.role;

  return (
    <PageWrapper title="Personalisation" comfortable>
      <div className="space-y-4">
        <SettingsSection
          title="Role Preset"
          description="Controls how responses are communicated, not what code edits are made. Included in every session."
        >
          <div className="space-y-3">
            <RolePresetPicker
              activeRole={activeRole}
              onSelect={(role) => setRole({ role })}
            />

            {activeRole ? (
              <div className="rounded-surface border border-border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Active preset prompt
                </p>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/80">
                  {PERSONALISATION_PRESETS[activeRole].prompt}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No role selected. Choose a preset above to activate it.
              </p>
            )}
          </div>
        </SettingsSection>

        <SettingsSection
          title="Custom Instructions"
          description="Additional instructions injected into every session. Use this to describe your preferences, role-specific context, or recurring guidance."
          footer={
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          }
        >
          <Textarea
            ref={textareaRef}
            className="min-h-[160px] font-mono text-xs"
            placeholder="e.g. Always explain changes in plain English before showing code..."
            defaultValue={savedValue}
          />
        </SettingsSection>
      </div>
    </PageWrapper>
  );
}
