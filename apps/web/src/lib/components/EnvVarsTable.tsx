"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Spinner,
} from "@eva/ui";
import {
  IconClipboard,
  IconKey,
  IconLock,
  IconPlus,
} from "@tabler/icons-react";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";
import { EnvVarRow } from "@/lib/components/envVars/EnvVarRow";
import { EnvVarAddRow } from "@/lib/components/envVars/EnvVarAddRow";
import { EnvVarColumnHeader } from "@/lib/components/envVars/EnvVarColumnHeader";
import { EnvVarSlotSections } from "@/lib/components/envVars/EnvVarSlotSections";
import { BulkPasteDialog } from "@/lib/components/envVars/BulkPasteDialog";
import { SLOT_ENV_VAR_KEYS, type EnvVarScope } from "./_utils/knownEnvVars";

export interface EnvVar {
  key: string;
  value: string;
  sandboxExclude: boolean;
}

interface EnvVarsTableProps {
  vars: EnvVar[] | undefined;
  onUpsert?: (
    key: string,
    value: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  onReveal?: (key: string) => Promise<string | null>;
  onRemove?: (key: string) => Promise<void>;
  onToggleSandboxExclude?: (
    key: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  description: string;
  /** Repo tab shows VERCEL_PROJECT_ID; team tab omits repo-only infra slots. */
  scope?: EnvVarScope;
  readOnly?: boolean;
}

/**
 * Environment variables for a repo or a team.
 *
 * Known keys are surfaced first as named provider slots; everything else lands in
 * the free-form list below, split by whether it reaches the sandbox. Rows are a
 * CSS grid rather than a `<table>` (see `EnvVarRow`), and each row owns its own
 * reveal/edit state, so this component only tracks what is genuinely shared:
 * whether the add row is open, and which key is pending deletion.
 */
export function EnvVarsTable({
  vars,
  onUpsert,
  onReveal,
  onRemove,
  onToggleSandboxExclude,
  description,
  scope = "repo",
  readOnly = false,
}: EnvVarsTableProps) {
  const [adding, setAdding] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  // Seeds the paste dialog when a multi-line paste is diverted out of the add
  // row; the dialog is keyed on this so a new paste replaces any stale draft.
  const [bulkSeed, setBulkSeed] = useState("");

  const handleAdd = async (key: string, value: string) => {
    if (!onUpsert) return;
    await onUpsert(key, value, false);
    setAdding(false);
  };

  const handleMultilinePaste = (text: string) => {
    setBulkSeed(text);
    setShowBulkPaste(true);
    setAdding(false);
  };

  const openBulkPaste = () => {
    setBulkSeed("");
    setShowBulkPaste(true);
  };

  const confirmDelete = async () => {
    if (deleteKey === null || !onRemove) return;
    await onRemove(deleteKey);
    setDeleteKey(null);
  };

  // Known slot keys are surfaced above — keep them out of the free-form list.
  const freeformVars = vars?.filter((v) => !SLOT_ENV_VAR_KEYS.has(v.key));
  const sandboxVars = (
    freeformVars?.filter((v) => !v.sandboxExclude) ?? []
  ).sort((a, b) => a.key.localeCompare(b.key));
  const excludedVars = (
    freeformVars?.filter((v) => v.sandboxExclude) ?? []
  ).sort((a, b) => a.key.localeCompare(b.key));
  const showRows = (freeformVars && freeformVars.length > 0) || adding;

  const renderRow = (v: EnvVar) => (
    <EnvVarRow
      key={v.key}
      envVar={v}
      readOnly={readOnly}
      onUpsert={onUpsert}
      onReveal={onReveal}
      onToggleSandboxExclude={onToggleSandboxExclude}
      onRequestDelete={setDeleteKey}
    />
  );

  /** Add and bulk-paste both create free-form vars, so they sit on that card. */
  const freeformActions = readOnly ? undefined : (
    <div className="flex shrink-0 items-center gap-2">
      <Button size="sm" variant="outline" onClick={openBulkPaste}>
        <IconClipboard size={14} />
        Paste
      </Button>
      <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
        <IconPlus size={14} />
        Add Variable
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      {vars !== undefined ? (
        <EnvVarSlotSections
          vars={vars}
          scope={scope}
          readOnly={readOnly}
          onUpsert={onUpsert}
          onReveal={onReveal}
          onRemove={onRemove}
        />
      ) : null}

      {vars === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Rows own the card's full width, so the body carries no padding. */}
          <SettingsSection
            title="Other variables"
            description="Anything not covered by a known slot above."
            action={freeformActions}
            bodyVariant="list"
          >
            {showRows ? (
              <div className="overflow-x-auto">
                <div className="min-w-[22rem]">
                  <EnvVarColumnHeader />
                  <div className="divide-y divide-border">
                    {adding ? (
                      <EnvVarAddRow
                        onSubmit={handleAdd}
                        onCancel={() => setAdding(false)}
                        onMultilinePaste={handleMultilinePaste}
                      />
                    ) : null}
                    {sandboxVars.map(renderRow)}
                  </div>
                  {sandboxVars.length === 0 && !adding ? (
                    <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                      No sandbox variables
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <SettingsEmptyState
                icon={IconKey}
                title="No other variables"
                description="Add one to inject it into every sandbox for this scope."
              />
            )}
          </SettingsSection>

          {excludedVars.length > 0 ? (
            <SettingsSection
              title={
                <span className="flex items-center gap-1.5">
                  <IconLock size={14} className="text-warning" />
                  Excluded from Sandbox
                </span>
              }
              description="Held for the platform only — these are never injected into a sandbox."
              bodyVariant="list"
            >
              <div className="overflow-x-auto">
                <div className="min-w-[22rem]">
                  <EnvVarColumnHeader />
                  <div className="divide-y divide-border">
                    {excludedVars.map(renderRow)}
                  </div>
                </div>
              </div>
            </SettingsSection>
          ) : null}
        </>
      )}

      <BulkPasteDialog
        key={bulkSeed}
        open={showBulkPaste}
        onOpenChange={setShowBulkPaste}
        initialText={bulkSeed}
        onUpsert={onUpsert}
      />

      <Dialog
        open={deleteKey !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Variable</DialogTitle>
          </DialogHeader>
          <p className="text-2sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-mono font-medium text-foreground">
              {deleteKey}
            </span>
            ? This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteKey(null)}
            >
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
