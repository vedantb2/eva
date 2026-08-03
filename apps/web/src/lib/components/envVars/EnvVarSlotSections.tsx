"use client";

import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { EnvVarProviderSlots } from "@/lib/components/EnvVarProviderSlots";
import type { EnvVar } from "@/lib/components/EnvVarsTable";
import {
  KNOWN_ENV_VARS,
  INFRA_ENV_VARS,
  CONVEX_ENV_VARS,
  filterSlotsForScope,
  type EnvVarScope,
} from "@/lib/components/_utils/knownEnvVars";

interface EnvVarSlotSectionsProps {
  vars: EnvVar[];
  scope: EnvVarScope;
  readOnly: boolean;
  onUpsert?: (
    key: string,
    value: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  onReveal?: (key: string) => Promise<string | null>;
  onRemove?: (key: string) => Promise<void>;
}

/**
 * The named paste-in slots for env vars Eva knows about, grouped by what they
 * unlock. Each group is one card of hairline-divided slot rows; anything not
 * matched by a slot falls through to the free-form list below them.
 */
export function EnvVarSlotSections({
  vars,
  scope,
  readOnly,
  onUpsert,
  onReveal,
  onRemove,
}: EnvVarSlotSectionsProps) {
  return (
    <>
      <SettingsSection title="Coding agents" bodyVariant="list">
        <EnvVarProviderSlots
          entries={filterSlotsForScope(KNOWN_ENV_VARS, scope)}
          vars={vars}
          onUpsert={onUpsert}
          onReveal={onReveal}
          onRemove={onRemove}
          readOnly={readOnly}
        />
      </SettingsSection>
      <SettingsSection title="Infrastructure" bodyVariant="list">
        <EnvVarProviderSlots
          entries={filterSlotsForScope(INFRA_ENV_VARS, scope)}
          defaultSandboxExclude
          vars={vars}
          onUpsert={onUpsert}
          onReveal={onReveal}
          onRemove={onRemove}
          readOnly={readOnly}
          removeDialogDescription="Sandbox provisioning may fail until you paste it again."
        />
      </SettingsSection>
      <SettingsSection title="Convex" bodyVariant="list">
        <EnvVarProviderSlots
          entries={filterSlotsForScope(CONVEX_ENV_VARS, scope)}
          vars={vars}
          onUpsert={onUpsert}
          onReveal={onReveal}
          onRemove={onRemove}
          readOnly={readOnly}
          removeDialogDescription="The sandboxed app may lose access to its Convex backend until you paste it again."
        />
      </SettingsSection>
    </>
  );
}
