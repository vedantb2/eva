"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
  Textarea,
} from "@eva/ui";
import { parseEnvVars } from "@/lib/components/_utils/parseEnvVars";

interface BulkPasteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Seeded when a multi-line paste is diverted here from the add row. */
  initialText: string;
  onUpsert?: (
    key: string,
    value: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
}

/**
 * `KEY=VALUE` bulk import.
 *
 * Keyed by `initialText` at the call site so a fresh paste remounts it with the
 * pasted body already in the textarea, which keeps the draft out of the parent.
 */
export function BulkPasteDialog({
  open,
  onOpenChange,
  initialText,
  onUpsert,
}: BulkPasteDialogProps) {
  const [bulkText, setBulkText] = useState(initialText);
  const [bulkSaving, setBulkSaving] = useState(false);

  const parsedPreview = parseEnvVars(bulkText);

  const handleBulkImport = async () => {
    if (!onUpsert) return;
    if (parsedPreview.length === 0) return;
    setBulkSaving(true);
    await Promise.all(
      parsedPreview.map(({ key, value }) => onUpsert(key, value, false)),
    );
    setBulkSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paste Environment Variables</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Paste your variables in <span className="font-mono">KEY=VALUE</span>{" "}
            format, one per line. Lines starting with{" "}
            <span className="font-mono">#</span> are ignored.
          </p>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"API_KEY=abc123\nDATABASE_URL=postgres://..."}
            className="h-40 font-mono text-xs"
            autoFocus
          />
          {parsedPreview.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {parsedPreview.length} variable
              {parsedPreview.length !== 1 ? "s" : ""} detected
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleBulkImport}
            disabled={parsedPreview.length === 0 || bulkSaving}
          >
            {bulkSaving ? <Spinner size="sm" className="mr-1.5" /> : null}
            Import{" "}
            {parsedPreview.length > 0
              ? `${parsedPreview.length} Variable${parsedPreview.length !== 1 ? "s" : ""}`
              : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
