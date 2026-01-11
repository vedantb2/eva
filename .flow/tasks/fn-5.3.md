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
TBD

## Evidence
- Commits:
- Tests:
- PRs:
