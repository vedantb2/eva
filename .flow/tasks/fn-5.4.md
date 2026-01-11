# fn-5.4 Add Convex functions for taskComments CRUD

## Description

Create `backend/convex/taskComments.ts` with:

1. **`listByTask`**: Query comments for a task, ordered by `createdAt`
2. **`create`**: Mutation to add comment with authorId and timestamp
3. **`remove`**: Mutation to delete comment

## Files to Create/Modify
- `backend/convex/taskComments.ts` (new)

## Acceptance
- [ ] `listByTask` returns comments ordered by creation time
- [ ] `create` adds comment with current timestamp
- [ ] `remove` deletes comment
- [ ] TypeScript compiles without errors

## Done summary
- Created taskComments.ts with listByTask, create, remove functions
- listByTask returns comments sorted by createdAt
- create uses identity.subject as authorId
- All functions verify ownership through task's board

Why:
- Enable comment threads on tasks in TaskDetailModal

Verification:
- npx convex dev --once passes without errors
## Evidence
- Commits: c6407bb47785e275a4a1f2f5f1dd38b3e3e76843
- Tests: npx convex dev --once
- PRs: