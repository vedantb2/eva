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
- Created githubRepos.ts with list, get, getByOwnerAndName, create, remove functions
- All functions require authentication
- Create mutation checks for duplicate repos before insert
- Using index by_owner_name for efficient lookup

Why:
- Enable CRUD operations for GitHub repository management
- Support repo-to-board relationship in Repositories page

Verification:
- npx convex dev --once passes without errors
## Evidence
- Commits: fa8e2d915c780f1071bf0c70f69bdc2e837d6dde
- Tests: npx convex dev --once
- PRs: