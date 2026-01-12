# fn-6.2 Add features table to Convex schema

## Description

Add the `features` table to store feature groupings that contain tasks.

### Schema Definition

```typescript
features: defineTable({
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  planId: v.optional(v.id("plans")),
  title: v.string(),
  description: v.optional(v.string()),
  branchName: v.string(),
  status: v.union(v.literal("planning"), v.literal("active"), v.literal("completed"), v.literal("archived")),
})
  .index("by_repo", ["repoId"])
  .index("by_user", ["userId"])
  .index("by_repo_and_status", ["repoId", "status"])
  .index("by_plan", ["planId"])
```

### Key Points
- `planId` links back to the plan that created this feature (optional for manually created features)
- `branchName` stores the base branch name (e.g., "conductor/feature-auth")
- `status` tracks feature lifecycle

### Files to Modify
- `backend/convex/schema.ts`
## Acceptance
- [ ] TBD

## Done summary
- Added `features` table with fields: repoId, userId, planId, title, description, branchName, status
- Created indexes: by_repo, by_user, by_repo_and_status, by_plan
- Status tracks feature lifecycle: planning, active, completed, archived
- planId is optional to support manually created features
## Evidence
- Commits: ed6c63e
- Tests:
- PRs: