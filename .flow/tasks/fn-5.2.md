# fn-5.2 Add Convex functions for githubRepos CRUD

## Description

Create `backend/convex/githubRepos.ts` with query and mutation functions:

1. **`list`**: Query all repos (or filter by owner)
2. **`get`**: Query single repo by ID
3. **`getByOwnerAndName`**: Query repo by owner + name
4. **`create`**: Mutation to add new repo
5. **`remove`**: Mutation to delete repo

Follow patterns from existing files like `agentTasks.ts`.

## Files to Create/Modify
- `backend/convex/githubRepos.ts` (new)

## Acceptance
- [ ] `list` query returns all repos
- [ ] `get` query returns single repo by ID
- [ ] `create` mutation adds repo with owner, name, installationId
- [ ] `remove` mutation deletes repo
- [ ] TypeScript compiles without errors

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
