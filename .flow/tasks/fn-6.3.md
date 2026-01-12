# fn-6.3 Add taskDependencies table to Convex schema

## Description

Add the `taskDependencies` table for many-to-many task dependency relationships.

### Schema Definition

```typescript
taskDependencies: defineTable({
  taskId: v.id("agentTasks"),
  dependsOnId: v.id("agentTasks"),
})
  .index("by_task", ["taskId"])
  .index("by_dependency", ["dependsOnId"])
```

### Key Points
- `taskId` is the task that is blocked
- `dependsOnId` is the task that must complete first
- Query `by_task` to get all dependencies of a task
- Query `by_dependency` to get all tasks blocked by a specific task

### Files to Modify
- `backend/convex/schema.ts`
## Acceptance
- [ ] TBD

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
