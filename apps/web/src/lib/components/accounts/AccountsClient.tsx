"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api, type Id } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";
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
      credentialKeys: account.credentials.map((entry) => entry.key),
    });
    setDialogOpen(true);
  };

  return (
    <PageWrapper title="Accounts" comfortable>
      <SettingsSection
        title="Your accounts"
        description="Tasks, sessions, and projects you create default to your account for that provider, otherwise Team. Collaborators' Make changes still bill your sticky account."
        action={
          <Button size="sm" onClick={openCreate}>
            <IconPlus size={16} className="mr-1.5" />
            Add account
          </Button>
        }
        // The list and its empty state manage their own padding.
        bodyClassName="p-0"
      >
        {accounts === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : accounts.length === 0 ? (
          <SettingsEmptyState
            icon={IconKey}
            title="No accounts yet"
            description="Add one to run agents on your own credentials instead of the team's."
          />
        ) : (
          <div className="divide-y divide-border">
            {accounts.map((account) => (
              <div
                key={account._id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {account.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
      </SettingsSection>

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
