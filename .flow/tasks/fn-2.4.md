# fn-2.4: Implement Convex functions for agent tasks lifecycle

## Description

Create `backend/convex/agentTasks.ts` with queries and mutations for task management:

- `listByBoard` - Query all tasks for a board
- `listByColumn` - Query tasks in a specific column (ordered)
- `get` - Query single task by ID
- `create` - Mutation to create task in a column
- `update` - Mutation to update title/description
- `moveToColumn` - Mutation to move task between columns (triggers run if isRunColumn)
- `updateOrder` - Mutation to reorder within column
- `updateStatus` - Mutation to directly set status (for agent callbacks)
- `remove` - Mutation to delete task (cascade delete runs)

## Files to Create

- `backend/convex/agentTasks.ts`

## Implementation Notes

- `moveToColumn` is the critical mutation:
  1. Check if target column has `isRunColumn: true`
  2. If yes, set task status to "queued" and create agentRun
  3. Call internal action to trigger Modal agent (placeholder for now)
- Status transitions: idle -> queued -> running -> (completed|failed)
- All mutations verify board ownership through relations

## Acceptance Criteria

- [ ] `agentTasks.create` adds task with "idle" status
- [ ] `agentTasks.moveToColumn` triggers run creation for run columns
- [ ] `agentTasks.updateStatus` allows agent callback to update status
- [ ] `agentTasks.remove` cascades to associated runs
- [ ] All operations verify board ownership through column->board
