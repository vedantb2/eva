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
- Updated boardValidator to include repoId field
- Updated create mutation to accept optional repoId
- Added listByRepo query filtering by repo with owner check

Why:
- Enable 1:1 board-to-repo mapping for per-repository Kanban boards

Verification:
- npx convex dev --once passes without errors
## Evidence
- Commits: 9a98468cb6e8f6baf2faacb479f9d5b1843bff75
- Tests: npx convex dev --once
- PRs: