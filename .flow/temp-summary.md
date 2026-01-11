- Installed @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities via pnpm
- Updated KanbanBoard with DndContext, drag handlers, and DragOverlay
- Updated KanbanColumn with useDroppable and SortableContext
- Updated TaskCard with useSortable, drag handle (grip icon), and visual feedback

Why:
- Enable drag-and-drop to move tasks between columns and reorder within columns
- dnd-kit provides keyboard accessibility out of the box

Verification:
- TypeScript compiles without errors
- Components structured for drag-and-drop functionality
