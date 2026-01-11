# fn-2.3: Implement Convex functions for columns management

## Description

Create `backend/convex/columns.ts` with queries and mutations for column management:

- `listByBoard` - Query all columns for a board (ordered)
- `create` - Mutation to add column at end
- `update` - Mutation to rename column or toggle isRunColumn
- `reorder` - Mutation to change column order
- `remove` - Mutation to delete column (cascade delete tasks)

## Files to Create

- `backend/convex/columns.ts`

## Implementation Notes

- Verify board ownership through board lookup before any mutation
- `reorder` should accept new order value and shift other columns
- `remove` must move or delete tasks in that column before removing
- Only one column should have `isRunColumn: true` per board

## Acceptance Criteria

- [ ] `columns.listByBoard` returns columns sorted by order
- [ ] `columns.create` adds column at max(order) + 1
- [ ] `columns.update` can rename and toggle isRunColumn flag
- [ ] `columns.reorder` correctly shifts column positions
- [ ] `columns.remove` cascades to tasks in that column
- [ ] All operations verify board ownership
