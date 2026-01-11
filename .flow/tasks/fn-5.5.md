# fn-5.5 Update boards functions to support repo filtering

## Description

Update `backend/convex/boards.ts` to:

1. Add `repoId` to create mutation args (optional)
2. Add `listByRepo` query to filter boards by repo
3. Update validators to include `repoId` field

## Files to Modify
- `backend/convex/boards.ts`

## Acceptance
- [ ] `create` mutation accepts optional `repoId`
- [ ] `listByRepo` query returns boards for a specific repo
- [ ] Existing board functionality unchanged
- [ ] TypeScript compiles without errors

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
