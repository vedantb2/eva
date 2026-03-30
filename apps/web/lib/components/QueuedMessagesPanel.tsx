"use client";

import { useEffect, useState } from "react";
import type { Id } from "@conductor/backend";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Queue,
  QueueItem,
  QueueItemAction,
  QueueItemActions,
  QueueItemContent,
  QueueItemIndicator,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@conductor/ui";
import { IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react";

interface QueuedMessageItem {
  id: Id<"queuedMessages">;
  content: string;
  info?: string;
}

interface QueuedMessagesPanelProps {
  items: QueuedMessageItem[];
  label?: string;
  onEdit?: (id: Id<"queuedMessages">, content: string) => Promise<void>;
  onDelete?: (id: Id<"queuedMessages">) => Promise<void>;
}

export function QueuedMessagesPanel({
  items,
  label = "Queued",
  onEdit,
  onDelete,
}: QueuedMessagesPanelProps) {
  const [editingItem, setEditingItem] = useState<QueuedMessageItem | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = useState<QueuedMessageItem | null>(
    null,
  );
  const [draftContent, setDraftContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setDraftContent(editingItem?.content ?? "");
  }, [editingItem]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <Queue className="mb-2">
        <QueueSection defaultOpen>
          <QueueSectionTrigger>
            <QueueSectionLabel count={items.length} label={label} />
          </QueueSectionTrigger>
          <QueueSectionContent>
            <QueueList>
              {items.map((item) => (
                <QueueItem key={item.id}>
                  <QueueItemIndicator />
                  <QueueItemContent className="truncate">
                    <div className="truncate">{item.content}</div>
                  </QueueItemContent>
                  <QueueItemActions>
                    {item.info ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <QueueItemAction aria-label="Queued message details">
                            <IconInfoCircle size={14} />
                          </QueueItemAction>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.info}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                    {onEdit ? (
                      <QueueItemAction
                        aria-label="Edit queued message"
                        onClick={() => setEditingItem(item)}
                      >
                        <IconPencil size={14} />
                      </QueueItemAction>
                    ) : null}
                    {onDelete ? (
                      <QueueItemAction
                        aria-label="Delete queued message"
                        onClick={() => setDeletingItem(item)}
                      >
                        <IconTrash size={14} />
                      </QueueItemAction>
                    ) : null}
                  </QueueItemActions>
                </QueueItem>
              ))}
            </QueueList>
          </QueueSectionContent>
        </QueueSection>
      </Queue>

      <Dialog
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit queued message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                isSaving || !draftContent.trim() || !editingItem || !onEdit
              }
              onClick={async () => {
                if (!editingItem || !onEdit) {
                  return;
                }
                setIsSaving(true);
                try {
                  await onEdit(editingItem.id, draftContent);
                  setEditingItem(null);
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingItem(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete queued message</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove this queued prompt before it runs?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting || !deletingItem || !onDelete}
              onClick={async () => {
                if (!deletingItem || !onDelete) {
                  return;
                }
                setIsDeleting(true);
                try {
                  await onDelete(deletingItem.id);
                  setDeletingItem(null);
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
