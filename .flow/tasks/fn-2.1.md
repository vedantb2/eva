# fn-2.1: Extend Convex schema with boards, columns, and enhanced task tables

## Description

Update `backend/convex/schema.ts` to add the new tables required for the agent orchestration platform:

1. **boards** - Container for columns and tasks, owned by a user
2. **columns** - Ordered columns within a board (with optional `isRunColumn` flag)
3. **agentTasks** - Enhanced tasks with agent-specific fields (status, repoId)
4. **agentRuns** - Execution history with logs array
5. **githubRepos** - GitHub repository metadata

## Files to Modify

- `backend/convex/schema.ts` (lines 31-53) - Replace existing `projects` and `tasks` tables with new schema

## Implementation Notes

- Keep existing `users` and `userMigrations` tables unchanged
- Add proper indexes for all foreign key relationships
- Use union types for status fields as shown in spec
- The logs array in agentRuns should be structured: `{ timestamp, level, message }`
- Mark columns with `isRunColumn: true` to auto-trigger agent runs

## Acceptance Criteria

- [ ] `boards` table with `name`, `ownerId`, `createdAt` and `by_owner` index
- [ ] `columns` table with `boardId`, `name`, `order`, `isRunColumn` and `by_board` index
- [ ] `agentTasks` table with all agent fields and proper indexes
- [ ] `agentRuns` table with logs array and `by_task` index
- [ ] `githubRepos` table with metadata fields
- [ ] Convex dev server runs without schema errors
