# fn-5.1 Extend Convex schema with subtasks, comments, and repo-board relationship

## Description

Update `backend/convex/schema.ts` to add:

1. **Update `boards` table**: Add optional `repoId: v.optional(v.id("githubRepos"))` field
2. **Update `agentTasks` table**: Add `branchName: v.optional(v.string())` field
3. **New `subtasks` table**:
   ```typescript
   subtasks: defineTable({
     parentTaskId: v.id("agentTasks"),
     title: v.string(),
     completed: v.boolean(),
     order: v.number(),
   }).index("by_parent", ["parentTaskId"])
   ```
4. **New `taskComments` table**:
   ```typescript
   taskComments: defineTable({
     taskId: v.id("agentTasks"),
     content: v.string(),
     authorId: v.string(),
     createdAt: v.number(),
   }).index("by_task", ["taskId"])
   ```

## Files to Modify
- `backend/convex/schema.ts`

## Acceptance
- [ ] `boards` table has `repoId` optional field
- [ ] `agentTasks` table has `branchName` optional field
- [ ] `subtasks` table exists with index on `parentTaskId`
- [ ] `taskComments` table exists with index on `taskId`
- [ ] `npx convex dev --once` passes without errors

## Done summary
- Added repoId field to boards table with by_repo index
- Added branchName field to agentTasks table
- Created subtasks table with parentTaskId, title, completed, order fields and by_parent index
- Created taskComments table with taskId, content, authorId, createdAt fields and by_task index

Why:
- Enable 1:1 board-to-repo mapping for per-repository Kanban boards
- Support feature branches per task
- Enable hierarchical task breakdown with subtasks
- Allow discussion threads on tasks

Verification:
- npx convex dev --once passes without errors
## Evidence
- Commits: c01bbf573a47e31a12544115fb25f3cf3f58d0bb
- Tests: npx convex dev --once
- PRs: