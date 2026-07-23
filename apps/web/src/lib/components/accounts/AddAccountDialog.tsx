"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api, type AIProvider, type Id } from "@conductor/backend";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  Spinner,
  ProviderIcon,
  cn,
} from "@conductor/ui";
import {
  PROVIDER_CREDENTIAL_FIELDS,
  PROVIDER_LABELS,
  ACCOUNT_ACCENT_SWATCHES,
} from "./_credentialSpec";

const PROVIDERS: ReadonlyArray<AIProvider> = [
  "claude",
  "cursor",
  "codex",
  "opencode",
];

/** The existing account being edited (values arrive masked; revealed on open). */
export interface EditingAccount {
  _id: Id<"userProviderAccounts">;
  provider: AIProvider;
  label: string;
  accentColor?: string;
  credentialKeys: ReadonlyArray<string>;
}

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: EditingAccount | null;
}

/**
 * Create or edit a provider account. Label is derived from the user's first
 * name server-side — this dialog only collects provider, accent, and secrets.
 */
export function AddAccountDialog({
  open,
  onOpenChange,
  editing,
}: AddAccountDialogProps) {
  const upsert = useAction(api.userProviderAccountsActions.upsert);
  const revealValue = useAction(api.userProviderAccountsActions.revealValue);

  const [provider, setProvider] = useState<AIProvider>("claude");
  const [accentColor, setAccentColor] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [prefilling, setPrefilling] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      setProvider("claude");
      setAccentColor("");
      setValues({});
      return;
    }
    setProvider(editing.provider);
    setAccentColor(editing.accentColor ?? "");
    setValues({});
    setPrefilling(true);
    let cancelled = false;
    void (async () => {
      const revealed: Record<string, string> = {};
      for (const key of editing.credentialKeys) {
        const value = await revealValue({ accountId: editing._id, key });
        if (value !== null) revealed[key] = value;
      }
      if (!cancelled) {
        setValues(revealed);
        setPrefilling(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, editing, revealValue]);

  const fields = PROVIDER_CREDENTIAL_FIELDS[provider];
  const canSave = fields.every(
    (field) => !field.required || (values[field.key]?.trim().length ?? 0) > 0,
  );

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const credentials = fields.flatMap((field) => {
      const value = values[field.key]?.trim() ?? "";
      return value.length > 0 ? [{ key: field.key, value }] : [];
    });
    await upsert({
      accountId: editing?._id,
      provider,
      accentColor: accentColor || undefined,
      credentials,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit account" : "Add account"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Provider
            </p>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={editing !== null}
                  onClick={() => setProvider(option)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    provider === option
                      ? "border-border bg-muted text-foreground"
                      : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/60",
                    editing !== null && "cursor-not-allowed opacity-60",
                  )}
                >
                  <ProviderIcon provider={option} size={14} />
                  {PROVIDER_LABELS[option]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Shown as your first name with this provider&apos;s icon.
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Accent (optional)
            </p>
            <div className="flex items-center gap-2">
              {ACCOUNT_ACCENT_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Accent ${swatch}`}
                  onClick={() =>
                    setAccentColor((prev) => (prev === swatch ? "" : swatch))
                  }
                  style={{ backgroundColor: swatch }}
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform",
                    accentColor === swatch
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105",
                  )}
                />
              ))}
            </div>
          </div>

          {prefilling ? (
            <div className="flex items-center justify-center py-6">
              <Spinner />
            </div>
          ) : (
            fields.map((field) => (
              <div key={field.key}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {field.label}
                </p>
                {field.multiline ? (
                  <Textarea
                    value={values[field.key] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="h-28 font-mono text-xs"
                  />
                ) : (
                  <Input
                    type="text"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    value={values[field.key] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="h-8 font-mono text-xs"
                    autoFocus={field === fields[0]}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!canSave || saving}>
            {saving && <Spinner size="sm" className="mr-1.5" />}
            {editing ? "Save" : "Add account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
