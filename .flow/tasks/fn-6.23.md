# fn-6.23 Implement task generation from finalized spec (1-10 tasks)

## Description

Implement task generation from a finalized spec (1-10 tasks).

### Implementation

```typescript
// web/lib/utils/parseSpec.ts
export function parseSpecTasks(spec: string): ParsedTask[] {
  // Extract tasks from spec markdown format
  // Returns array of { title, description, acceptance }
}

// backend/convex/features.ts
export const createFromPlan = mutation({
  args: {
    planId: v.id("plans"),
    featureTitle: v.string(),
    branchName: v.string(),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    const tasks = parseSpecTasks(plan.generatedSpec);
    
    // Create feature
    const featureId = await ctx.db.insert("features", {
      repoId: plan.repoId,
      userId: plan.userId,
      planId: args.planId,
      title: args.featureTitle,
      branchName: args.branchName,
      status: "planning",
    });
    
    // Create tasks with sequential numbers
    for (let i = 0; i < tasks.length; i++) {
      await ctx.db.insert("agentTasks", {
        featureId,
        taskNumber: i + 1,
        title: tasks[i].title,
        description: tasks[i].description,
        status: "backlog",
        // ... other fields
      });
    }
    
    // Update plan state
    await ctx.db.patch(args.planId, { state: "feature_created" });
    
    return featureId;
  },
});
```

### Key Points
- Parse spec markdown to extract tasks
- Create feature first, then tasks
- Assign sequential taskNumber (1, 2, 3...)
- Update plan state to feature_created

### Files to Create/Modify
- `web/lib/utils/parseSpec.ts`
- `backend/convex/features.ts`
## Acceptance
- [ ] TBD

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
