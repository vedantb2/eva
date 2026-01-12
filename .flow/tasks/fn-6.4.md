# fn-6.4 Update agentTasks table with featureId, taskNumber, and new status values

## Description

Update the existing `agentTasks` table with new fields for features, task numbering, and expanded status.

### Schema Changes

Add these fields to `agentTasks`:
```typescript
featureId: v.optional(v.id("features")),
taskNumber: v.optional(v.number()),
```

Update status union to include 6 states:
```typescript
status: v.union(
  v.literal("archived"),
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("code_review"),
  v.literal("done")
),
```

Add new indexes:
```typescript
.index("by_feature", ["featureId"])
.index("by_feature_and_status", ["featureId", "status"])
```

### Key Points
- `featureId` is optional to support quick tasks (no feature)
- `taskNumber` is for sequential numbering within a feature (1, 2, 3...)
- Status migration: map old values (idle->backlog, queued->todo, running->in_progress, reviewing->code_review, completed->done, failed->backlog)

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
