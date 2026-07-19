"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@conductor/ui";
import { DaytonaLogo, VercelLogo } from "@/lib/components/ui/providerLogos";
import type { EnvVar } from "@/lib/components/EnvVarsTable";
import type { EnvVarScope } from "@/lib/components/_utils/envVarSlotTypes";
import { SANDBOX_PROVIDER_KEY } from "@/lib/components/_utils/knownEnvVars";

type SandboxProvider = "daytona" | "vercel";

function readProvider(vars: EnvVar[] | undefined): SandboxProvider {
  const entry = vars?.find((v) => v.key === SANDBOX_PROVIDER_KEY);
  if (!entry) return "daytona";
  return entry.value === "vercel" ? "vercel" : "daytona";
}

interface SandboxProviderToggleProps {
  vars: EnvVar[] | undefined;
  scope: EnvVarScope;
  onUpsert?: (
    key: string,
    value: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  readOnly?: boolean;
}

/**
 * Daytona vs Vercel switch for `SANDBOX_PROVIDER`. Writes through the same
 * upsert path as other env vars; value is non-secret and listed in plaintext.
 */
export function SandboxProviderToggle({
  vars,
  scope,
  onUpsert,
  readOnly = false,
}: SandboxProviderToggleProps) {
  const [saving, setSaving] = useState(false);
  const provider = readProvider(vars);

  const handleChange = async (next: SandboxProvider) => {
    if (!onUpsert || readOnly || next === provider || saving) return;
    setSaving(true);
    await onUpsert(SANDBOX_PROVIDER_KEY, next, true);
    setSaving(false);
  };

  const scopeHint =
    scope === "team"
      ? "Default for all repos in this team. Individual repos can override."
      : "Overrides the team default for this repo when set.";

  return (
    <div className="rounded-surface border border-border bg-muted/40 px-3 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">Sandbox provider</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{scopeHint}</p>
        </div>
        <Tabs
          value={provider}
          onValueChange={(value) => {
            if (value === "daytona" || value === "vercel") {
              void handleChange(value);
            }
          }}
        >
          <TabsList className="tabs-segmented h-9 shrink-0">
            <TabsTrigger
              value="daytona"
              disabled={readOnly || saving}
              className="gap-1.5 px-3 text-xs"
            >
              <DaytonaLogo size={14} />
              Daytona
            </TabsTrigger>
            <TabsTrigger
              value="vercel"
              disabled={readOnly || saving}
              className="gap-1.5 px-3 text-xs"
            >
              <VercelLogo size={14} />
              Vercel
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
