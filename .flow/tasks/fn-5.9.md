# fn-5.9 Update web/api.ts with new endpoint types

## Description

Update `web/api.ts` to add type definitions for all new Convex functions:

1. Add `githubRepos` function references (list, get, create, remove)
2. Add `subtasks` function references (listByTask, create, update, remove, reorder)
3. Add `taskComments` function references (listByTask, create, remove)
4. Add `specs` function references (generateSpec action)
5. Update `boards` with new listByRepo query

Follow existing patterns in the file using `FunctionReference` and `GenericId`.

## Files to Modify
- `web/api.ts`

## Acceptance
- [ ] All new queries/mutations have type definitions
- [ ] Types match Convex function signatures
- [ ] TypeScript compiles without errors

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
