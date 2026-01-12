# fn-6.1 Add plans table to Convex schema

## Description

Add the `plans` table to the Convex schema to store AI-generated specification plans.

### Schema Definition

```typescript
plans: defineTable({
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  rawInput: v.string(),
  generatedSpec: v.optional(v.string()),
  state: v.union(v.literal("draft"), v.literal("finalized"), v.literal("feature_created")),
  conversationHistory: v.array(v.object({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  })),
})
  .index("by_repo", ["repoId"])
  .index("by_user", ["userId"])
  .index("by_repo_and_state", ["repoId", "state"])
```

### Key Points
- `conversationHistory` stores the Q&A between user and AI
- `state` tracks the 3 plan states: draft, finalized, feature_created
- `generatedSpec` is optional (null during draft, filled after AI generates)

### Files to Modify
- `backend/convex/schema.ts`
## Acceptance
- [ ] `plans` table added to schema.ts
- [ ] All fields defined as specified (repoId, userId, title, rawInput, generatedSpec, state, conversationHistory)
- [ ] Indexes created: by_repo, by_user, by_repo_and_state
- [ ] `npx convex dev` runs without schema errors
## Done summary
- Added `plans` table with fields: repoId, userId, title, rawInput, generatedSpec, state, conversationHistory
- Created indexes: by_repo, by_user, by_repo_and_state
- State is a union type: draft | finalized | feature_created
- ConversationHistory stores user/assistant message pairs
- Schema compiles without errors
## Evidence
- Commits: 531abc9
- Tests:
- PRs: