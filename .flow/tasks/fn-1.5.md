# fn-1.5 Add drag-and-drop for task cards

## Description

Add drag-and-drop functionality to move tasks between columns and reorder within columns.

**Install:**
```bash
cd web && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Implementation:**
- Wrap `KanbanBoard` with `DndContext`
- Make `KanbanColumn` a droppable area
- Make `TaskCard` draggable with `useSortable`
- Handle `onDragEnd` to update task status and order

**Files to modify:**
- `web/lib/components/kanban/KanbanBoard.tsx` - Add DndContext
- `web/lib/components/kanban/KanbanColumn.tsx` - Add useDroppable
- `web/lib/components/kanban/TaskCard.tsx` - Add useSortable

**Behavior:**
- Drag task to different column → update status
- Drag within column → reorder (update order field)
- Visual feedback during drag (opacity, placeholder)
## Acceptance
- [ ] Tasks can be dragged between columns
- [ ] Moving task updates its status in Convex
- [ ] Tasks can be reordered within column
- [ ] Drag has visual feedback (reduced opacity, drop indicator)
- [ ] Keyboard accessible (dnd-kit provides this)
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
