import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@eva/ui";

type SessionListItem = FunctionReturnType<typeof api.sessions.list>[number];
type RepoRow = FunctionReturnType<typeof api.githubRepos.list>[number];

export interface SessionRenameTarget {
  session: SessionListItem;
  repo: RepoRow;
}

export interface SessionArchiveTarget {
  session: SessionListItem;
  repo: RepoRow;
  pathSegment: string;
}

interface SessionTabsDialogsProps {
  pathname: string;
  renameTarget: SessionRenameTarget | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onCloseRename: () => void;
  archiveTarget: SessionArchiveTarget | null;
  onCloseArchive: () => void;
}

/** Rename / archive confirm dialogs shared by the Chrome session tab strip. */
export function SessionTabsDialogs({
  pathname,
  renameTarget,
  renameValue,
  onRenameValueChange,
  onCloseRename,
  archiveTarget,
  onCloseArchive,
}: SessionTabsDialogsProps) {
  const navigate = useNavigate();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const archiveSession = useMutation(api.sessions.archive);
  const stopSandboxMutation = useMutation(api.sessions.stopSandbox);
  const updateSession = useMutation(api.sessions.update);

  const saveRename = () => {
    if (!renameTarget || !renameValue.trim()) return;
    void (async () => {
      setIsRenaming(true);
      try {
        await updateSession({
          id: renameTarget.session._id,
          title: renameValue.trim(),
        });
        onCloseRename();
      } catch (error) {
        setIsRenaming(false);
        throw error;
      }
      setIsRenaming(false);
    })();
  };

  return (
    <>
      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) onCloseRename();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename session</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameValue.trim() && renameTarget) {
                e.preventDefault();
                saveRename();
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={onCloseRename}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              disabled={!renameValue.trim() || isRenaming}
              onClick={saveRename}
            >
              {isRenaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) onCloseArchive();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Session</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will stop the sandbox and remove{" "}
            <span className="font-medium text-foreground">
              {archiveTarget?.session.title}
            </span>{" "}
            from the active tabs.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={onCloseArchive}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isArchiving}
              onClick={() => {
                if (!archiveTarget) return;
                void (async () => {
                  setIsArchiving(true);
                  try {
                    if (archiveTarget.session.sandboxId) {
                      await stopSandboxMutation({
                        sessionId: archiveTarget.session._id,
                      });
                    }
                    await archiveSession({ id: archiveTarget.session._id });
                    if (
                      pathname.includes(
                        `/sessions/${archiveTarget.pathSegment}`,
                      )
                    ) {
                      navigate({ to: "/sessions" });
                    }
                    onCloseArchive();
                  } catch (error) {
                    setIsArchiving(false);
                    throw error;
                  }
                  setIsArchiving(false);
                })();
              }}
            >
              {isArchiving ? "Archiving…" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
