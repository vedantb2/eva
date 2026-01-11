# fn-5.3 Add Convex functions for subtasks CRUD and reorder

## Description

Create `backend/convex/subtasks.ts` with:

1. **`listByTask`**: Query subtasks for a parent task, ordered by `order` field
2. **`create`**: Mutation to add subtask with auto-incrementing order
3. **`update`**: Mutation to update title or completed status
4. **`remove`**: Mutation to delete subtask
5. **`reorder`**: Mutation to update order field for drag-drop reordering

## Files to Create/Modify
- `backend/convex/subtasks.ts` (new)

## Acceptance
- [ ] `listByTask` returns subtasks ordered by `order` field
- [ ] `create` adds subtask with next available order number
- [ ] `update` can toggle `completed` and change `title`
- [ ] `remove` deletes subtask
- [ ] `reorder` updates order for multiple subtasks
- [ ] TypeScript compiles without errors

## Done summary
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
## Evidence
- Commits: 22f96b40c1a19a3982e34348dfd7f6cdd1c1fc85
- Tests: npx convex dev --once
- PRs: