- Created subtasks.ts with listByTask, create, update, remove, reorder functions
- All functions verify ownership through parent task's board
- listByTask returns subtasks sorted by order field
- create auto-assigns next order number
- reorder accepts batch updates for drag-drop

Why:
- Enable subtask management in TaskDetailModal
- Support hierarchical task breakdown

Verification:
- npx convex dev --once passes without errors
