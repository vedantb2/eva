- Created taskComments.ts with listByTask, create, remove functions
- listByTask returns comments sorted by createdAt
- create uses identity.subject as authorId
- All functions verify ownership through task's board

Why:
- Enable comment threads on tasks in TaskDetailModal

Verification:
- npx convex dev --once passes without errors
