"use client";

import { useQuery, useMutation } from "convex/react";
import { api, PERSONALISATION_PRESETS } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Textarea, Button, Spinner } from "@conductor/ui";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@conductor/ui";
import { IconBriefcase, IconCode, IconBrush } from "@tabler/icons-react";

const PRESET_ICONS = {
  business: IconBriefcase,
  dev: IconCode,
  designer: IconBrush,
} as const;

const PRESET_KEYS = ["business", "dev", "designer"] as const;

export function PersonalisationClient() {
  const personalisation = useQuery(api.auth.getPersonalisation);
  const setCustomInstructions = useMutation(api.auth.setCustomInstructions);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedValue = personalisation?.customInstructions ?? "";

  const handleSave = useCallback(async () => {
    const value = textareaRef.current?.value ?? "";
    await setCustomInstructions({ customInstructions: value });
  }, [setCustomInstructions]);

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
      <div className="space-y-6">
        {/* Preset section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Role Preset</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Based on your role. These instructions are automatically included
              in every session.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PRESET_KEYS.map((key) => {
              const preset = PERSONALISATION_PRESETS[key];
              const Icon = PRESET_ICONS[key];
              const isActive = activeRole === key;

              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-lg p-3 transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted/40 text-muted-foreground",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span className="text-xs font-medium">{preset.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-80">
                    {preset.description}
                  </p>
                </div>
              );
            })}
          </div>

          {activeRole ? (
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                Active preset prompt
              </p>
              <pre className="whitespace-pre-wrap text-xs font-mono text-foreground/80 leading-relaxed">
                {PERSONALISATION_PRESETS[activeRole].prompt}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No role selected. Your role can be set during onboarding.
            </p>
          )}
        </div>

        {/* Custom instructions section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Custom Instructions</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Additional instructions injected into every session. Use this to
              describe your preferences, role-specific context, or recurring
              guidance.
            </p>
          </div>

          <Textarea
            ref={textareaRef}
            className="min-h-[160px] text-xs font-mono"
            placeholder="e.g. Always explain changes in plain English before showing code..."
            defaultValue={savedValue}
          />

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
