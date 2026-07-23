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
import {
  IconArrowUp,
  IconInfoCircle,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QueuedMessageItem {
  id: Id<"queuedMessages">;
  content: string;
  info?: string;
}

interface QueuedMessagesPanelProps {
  items: QueuedMessageItem[];
  label?: string;
  renderContent?: (content: string) => React.ReactNode;
  onEdit?: (id: Id<"queuedMessages">, content: string) => Promise<void>;
  onDelete?: (id: Id<"queuedMessages">) => Promise<void>;
  /** When provided, items become reorderable; receives the new top-to-bottom id order. */
  onReorder?: (orderedIds: Id<"queuedMessages">[]) => Promise<void>;
}

/** A single sortable queue row (Cursor-style card: indicator + 2-line text + actions). */
function SortableQueuedItem({
  item,
  index,
  draggable,
  renderContent,
  onEditClick,
  onDeleteClick,
  onMoveToFront,
}: {
  item: QueuedMessageItem;
  index: number;
  draggable: boolean;
  renderContent?: (content: string) => React.ReactNode;
  onEditClick?: (item: QueuedMessageItem) => void;
  onDeleteClick?: (item: QueuedMessageItem) => void;
  onMoveToFront?: (item: QueuedMessageItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !draggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <QueueItem
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : undefined}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          aria-label={draggable ? "Drag to reorder queued message" : undefined}
          className={
            draggable
              ? "mt-0.5 shrink-0 cursor-grab touch-none rounded-full border-0 bg-transparent p-0"
              : "mt-0.5 shrink-0"
          }
          disabled={!draggable}
          {...(draggable ? { ...attributes, ...listeners } : {})}
        >
          <QueueItemIndicator />
        </button>
        <QueueItemContent className="text-xs">
          {renderContent ? renderContent(item.content) : item.content}
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
          {onEditClick ? (
            <QueueItemAction
              aria-label="Edit queued message"
              onClick={() => onEditClick(item)}
            >
              <IconPencil size={14} />
            </QueueItemAction>
          ) : null}
          {onMoveToFront && index > 0 ? (
            <QueueItemAction
              aria-label="Move queued message to front"
              onClick={() => onMoveToFront(item)}
            >
              <IconArrowUp size={14} />
            </QueueItemAction>
          ) : null}
          {onDeleteClick ? (
            <QueueItemAction
              aria-label="Delete queued message"
              onClick={() => onDeleteClick(item)}
            >
              <IconTrash size={14} />
            </QueueItemAction>
          ) : null}
        </QueueItemActions>
      </div>
    </QueueItem>
  );
}

/**
 * Pending-message queue above the composer on sandbox chat pages
 * (sessions, quick tasks, projects, designs). Built on AI Elements Queue.
 */
export function QueuedMessagesPanel({
  items,
  label = "Queued",
  renderContent,
  onEdit,
  onDelete,
  onReorder,
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setDraftContent(editingItem?.content ?? "");
  }, [editingItem]);

  if (items.length === 0) {
    return null;
  }

  const draggable = Boolean(onReorder) && items.length > 1;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!onReorder || !over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const orderedIds = arrayMove(items, oldIndex, newIndex).map(
      (item) => item.id,
    );
    void onReorder(orderedIds);
  };

  const handleMoveToFront = (item: QueuedMessageItem) => {
    if (!onReorder) return;
    const rest = items.filter((entry) => entry.id !== item.id);
    void onReorder([item.id, ...rest.map((entry) => entry.id)]);
  };

  return (
    <>
      <Queue className="mb-2">
        <QueueSection defaultOpen>
          <QueueSectionTrigger>
            <QueueSectionLabel count={items.length} label={label} />
          </QueueSectionTrigger>
          <QueueSectionContent>
            <QueueList>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((item, index) => (
                    <SortableQueuedItem
                      key={item.id}
                      item={item}
                      index={index}
                      draggable={draggable}
                      renderContent={renderContent}
                      onEditClick={onEdit ? setEditingItem : undefined}
                      onDeleteClick={onDelete ? setDeletingItem : undefined}
                      onMoveToFront={onReorder ? handleMoveToFront : undefined}
                    />
                  ))}
                </SortableContext>
              </DndContext>
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
                } catch (error) {
                  setIsSaving(false);
                  throw error;
                }
                setIsSaving(false);
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
                } catch (error) {
                  setIsDeleting(false);
                  throw error;
                }
                setIsDeleting(false);
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
