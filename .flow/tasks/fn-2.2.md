# fn-2.2: Implement Convex functions for boards CRUD

## Description

Create `backend/convex/boards.ts` with queries and mutations for board management:

- `list` - Query all boards for authenticated user
- `get` - Query single board by ID (with ownership check)
- `getWithColumns` - Query board with all columns and tasks (denormalized)
- `create` - Mutation to create board (auto-creates default columns)
- `update` - Mutation to rename board
- `remove` - Mutation to delete board (cascade delete columns, tasks, runs)

## Files to Create

- `backend/convex/boards.ts`

## Patterns to Follow

Reference `backend/convex/projects.ts` for:
- Query/mutation structure with typed validators
- Auth check pattern: `identity.subject` for userId
- Return type validators

## Implementation Notes

- `create` should auto-create 3 columns: "Backlog", "In Progress" (isRunColumn: true), "Done"
- `getWithColumns` should return nested structure for single-query board load
- `remove` must delete all related columns, tasks, and runs before deleting board
- All mutations verify `ownerId === identity.subject`

## Acceptance Criteria

- [ ] `boards.list` returns only boards owned by current user
- [ ] `boards.get` returns null for non-owned boards
- [ ] `boards.create` creates board with 3 default columns
- [ ] `boards.update` only allows owner to rename
- [ ] `boards.remove` cascades deletes to columns/tasks/runs
- [ ] All functions have proper TypeScript return validators
