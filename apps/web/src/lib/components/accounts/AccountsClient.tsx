"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api, type Id } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Spinner,
} from "@eva/ui";
import { IconKey, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { PROVIDER_LABELS } from "./_credentialSpec";
import { AddAccountDialog, type EditingAccount } from "./AddAccountDialog";

/**
 * Per-user "bring your own account" management. A user adds their own coding
 * agent logins (Claude Code OAuth token, Cursor API key, Codex/opencode auth);
 * when selected in a session or task's model picker, that account's credentials
 * are injected at sandbox launch instead of the shared team credential, so the
 * usage bills to the user. Values are encrypted at rest and only revealed on
 * demand.
 */
export function AccountsClient() {
  const accounts = useQuery(api.userProviderAccounts.list, {});
  const remove = useMutation(api.userProviderAccounts.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EditingAccount | null>(null);
  const [deleteId, setDeleteId] = useState<Id<"userProviderAccounts"> | null>(
    null,
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (account: NonNullable<typeof accounts>[number]) => {
    setEditing({
      _id: account._id,
      provider: account.provider,
      label: account.label,
      accentColor: account.accentColor,
      credentialKeys: account.credentials.map((entry) => entry.key),
    });
    setDialogOpen(true);
  };

  return (
    <PageWrapper title="Accounts" comfortable>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose text-xs text-muted-foreground">
          Add your own coding-agent accounts. Tasks, sessions, and projects you
          create default to your account for that provider (otherwise Team).
          Collaborators&apos; Make changes still bill your sticky account.
        </p>
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconPlus size={16} className="mr-1.5" />
          Add account
        </Button>
      </div>

      {accounts === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <IconKey size={48} className="mb-3 opacity-40" />
          <p className="text-sm">No accounts yet</p>
          <p className="mt-1 text-xs">
            Add one to run agents on your own credentials.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account._id}
              className="flex items-center gap-3 rounded-surface border border-border bg-muted/40 px-4 py-3"
            >
              <span
                className="size-3 shrink-0 rounded-full border border-border"
                style={{
                  backgroundColor: account.accentColor ?? "var(--muted)",
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{account.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {PROVIDER_LABELS[account.provider]} ·{" "}
                  {account.credentials.length} credential
                  {account.credentials.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => openEdit(account)}
                title="Edit"
              >
                <IconPencil size={14} />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setDeleteId(account._id)}
                title="Delete"
                className="text-destructive hover:text-destructive"
              >
                <IconTrash size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete this account? Sessions and tasks set to use it will fall back
            to the team credential. This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (deleteId) await remove({ accountId: deleteId });
                setDeleteId(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
