"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@eva/ui";
import { DaytonaLogo, VercelLogo } from "@/lib/components/ui/providerLogos";
import type { EnvVar } from "@/lib/components/EnvVarsTable";
import type { EnvVarScope } from "@/lib/components/_utils/envVarSlotTypes";
import { SANDBOX_PROVIDER_KEY } from "@/lib/components/_utils/knownEnvVars";

type SandboxProvider = "daytona" | "vercel";

function parseProvider(value: string | undefined): SandboxProvider | null {
  if (value === "vercel" || value === "daytona") return value;
  return null;
}

interface SandboxProviderToggleProps {
  vars: EnvVar[] | undefined;
  scope: EnvVarScope;
  onUpsert?: (
    key: string,
    value: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  /** Needed to read legacy encrypted SANDBOX_PROVIDER values once. */
  onReveal?: (key: string) => Promise<string | null>;
  readOnly?: boolean;
}

/**
 * Daytona vs Vercel switch for `SANDBOX_PROVIDER`. New writes are plaintext so
 * list queries can show the active provider; legacy `enc:` values are revealed
 * once and rewritten as plaintext.
 */
export function SandboxProviderToggle({
  vars,
  scope,
  onUpsert,
  onReveal,
  readOnly = false,
}: SandboxProviderToggleProps) {
  const entry = vars?.find((v) => v.key === SANDBOX_PROVIDER_KEY);
  const listed = parseProvider(entry?.value);
  const [revealed, setRevealed] = useState<SandboxProvider | null>(null);
  const [saving, setSaving] = useState(false);

  const provider = listed ?? revealed ?? "daytona";

  // Legacy encrypted values come back masked from list — reveal + heal once.
  useEffect(() => {
    if (listed !== null) return;
    if (entry === undefined || !onReveal) return;
    let cancelled = false;
    void (async () => {
      const value = await onReveal(SANDBOX_PROVIDER_KEY);
      if (cancelled) return;
      const parsed = parseProvider(value ?? undefined);
      if (parsed === null) return;
      setRevealed(parsed);
      // Rewrite as plaintext so the next list query works without reveal.
      if (onUpsert && !readOnly) {
        await onUpsert(SANDBOX_PROVIDER_KEY, parsed, true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entry?.key, entry?.value, listed, onReveal, onUpsert, readOnly]);

  const handleChange = async (next: SandboxProvider) => {
    if (!onUpsert || readOnly || next === provider || saving) return;
    setSaving(true);
    try {
      await onUpsert(SANDBOX_PROVIDER_KEY, next, true);
      setRevealed(next);
    } catch (error) {
      setSaving(false);
      throw error;
    }
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
        <div
          className="tabs-segmented inline-flex h-9 shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background p-1"
          role="group"
          aria-label="Sandbox provider"
        >
          <ProviderOption
            active={provider === "daytona"}
            disabled={readOnly || saving}
            onClick={() => void handleChange("daytona")}
            label="Daytona"
            icon={<DaytonaLogo size={14} />}
          />
          <ProviderOption
            active={provider === "vercel"}
            disabled={readOnly || saving}
            onClick={() => void handleChange("vercel")}
            label="Vercel"
            icon={<VercelLogo size={14} />}
          />
        </div>
      </div>
    </div>
  );
}

function ProviderOption({
  active,
  disabled,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        "disabled:pointer-events-none disabled:opacity-50",
        active
          ? "border border-border bg-card text-foreground shadow-sm"
          : "border border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
