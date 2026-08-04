import { useState } from "react";
import type { Id } from "@eva/backend";
import { findAIModelOption, getReasoningLevelLabel } from "@eva/backend";
import { UserInitials } from "@eva/shared";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ProviderIcon,
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
  formatModelDisplayLabel,
} from "@eva/ui";
import { IconArrowUp, IconPencil, IconTrash } from "@tabler/icons-react";
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

export interface QueuedMessageItem {
  /** Logical UI identity; optimistic rows deliberately have no Convex id. */
  id: string;
  serverId?: Id<"queuedMessages">;
  content: string;
  model?: string;
  reasoningLevel?: string;
  /** Who queued it — a shared chat's queue mixes several teammates' prompts. */
  userId?: Id<"users">;
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

/** Tooltip copy for a queued row's model + effort snapshot. */
function queueModelTooltip(
  model: string,
  reasoningLevel: string | undefined,
): string {
  const option = findAIModelOption(model);
  const modelLabel = formatModelDisplayLabel(option.provider, option.label);
  if (!reasoningLevel) return modelLabel;
  return `${modelLabel} · ${getReasoningLevelLabel(reasoningLevel)}`;
}

/** Left-rail drag handle: provider icon (with model/effort tooltip) or legacy dot. */
function QueueRowHandle({
  item,
  draggable,
  attributes,
  listeners,
}: {
  item: QueuedMessageItem;
  draggable: boolean;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
}) {
  const dragProps = draggable ? { ...attributes, ...listeners } : {};
  // Share one line-box with the text (`leading-4` / 16px) so the mark sits centered.
  const buttonClass = draggable
    ? "inline-flex size-4 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm border-0 bg-transparent p-0"
    : "inline-flex size-4 shrink-0 items-center justify-center border-0 bg-transparent p-0";

  if (!item.model) {
    return (
      <button
        type="button"
        aria-label={draggable ? "Drag to reorder queued message" : undefined}
        className={buttonClass}
        disabled={!draggable}
        {...dragProps}
      >
        <QueueItemIndicator className="mt-0" />
      </button>
    );
  }

  const option = findAIModelOption(item.model);
  const tooltip = queueModelTooltip(item.model, item.reasoningLevel);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={draggable ? `Drag to reorder · ${tooltip}` : tooltip}
          className={`${buttonClass} text-muted-foreground/70`}
          {...dragProps}
        >
          <ProviderIcon provider={option.provider} size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/** A single sortable queue row (provider handle + 2-line text + actions). */
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
      <div className="flex items-center gap-2.5">
        {/* Author then model, reading left to right as "who asked, on what".
            Fixed box because `UserInitials` renders nothing until the profile
            query resolves, which would otherwise shift the row. */}
        {item.userId ? (
          <span className="flex size-4 shrink-0 items-center justify-center">
            <UserInitials userId={item.userId} hideLastSeen />
          </span>
        ) : null}
        <QueueRowHandle
          item={item}
          draggable={draggable}
          attributes={attributes}
          listeners={listeners}
        />
        <QueueItemContent className="text-xs leading-4">
          {renderContent ? renderContent(item.content) : item.content}
        </QueueItemContent>
        <QueueItemActions className="items-center">
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
 * Pending-message queue flush above the composer on sandbox chat pages
 * (sessions, quick tasks, projects). Narrower inset bar with square bottom
 * corners so it blends into the input card — same idea as underCardLeading.
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
  const [draftForId, setDraftForId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editingId = editingItem?.id ?? null;
  if (editingId !== draftForId) {
    setDraftForId(editingId);
    setDraftContent(editingItem?.content ?? "");
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (items.length === 0) {
    return null;
  }

  const draggable =
    Boolean(onReorder) &&
    items.length > 1 &&
    items.every((item) => item.serverId !== undefined);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!onReorder || !over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const orderedIds = arrayMove(items, oldIndex, newIndex).flatMap((item) =>
      item.serverId ? [item.serverId] : [],
    );
    void onReorder(orderedIds);
  };

  const handleMoveToFront = (item: QueuedMessageItem) => {
    if (!onReorder) return;
    const rest = items.filter((entry) => entry.id !== item.id);
    if (!item.serverId) return;
    const restIds = rest.flatMap((entry) =>
      entry.serverId ? [entry.serverId] : [],
    );
    void onReorder([item.serverId, ...restIds]);
  };

  return (
    <>
      {/* Flush above the composer: narrower inset bar, square bottom so it
          blends into the input card (mirrors underCardLeading below). */}
      <Queue className="mx-auto mb-0 w-[calc(100%-1.5rem)] rounded-b-none rounded-t-surface bg-muted/50 shadow-none">
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
                      onEditClick={
                        onEdit && item.serverId ? setEditingItem : undefined
                      }
                      onDeleteClick={
                        onDelete && item.serverId ? setDeletingItem : undefined
                      }
                      onMoveToFront={
                        onReorder && item.serverId
                          ? handleMoveToFront
                          : undefined
                      }
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
                if (!editingItem?.serverId || !onEdit) {
                  return;
                }
                setIsSaving(true);
                try {
                  await onEdit(editingItem.serverId, draftContent);
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
                if (!deletingItem?.serverId || !onDelete) {
                  return;
                }
                setIsDeleting(true);
                try {
                  await onDelete(deletingItem.serverId);
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
