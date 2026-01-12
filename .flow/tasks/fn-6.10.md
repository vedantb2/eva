# fn-6.10 Create RepoLayout component with repo context and validation

## Description

Create the RepoLayout component that wraps all repo-scoped pages and provides repo context.

### Implementation

```typescript
// web/app/(main)/[repo]/layout.tsx
export default function RepoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { repo: string };
}) {
  // 1. Decode repo param (owner-name -> owner/name)
  // 2. Validate repo exists in DB
  // 3. Provide RepoContext
  // 4. Render children
}
```

### Key Points
- Use `decodeRepoSlug` from URL helpers (fn-6.43)
- Query Convex to validate repo exists and user has access
- Show loading state while validating
- Show 404 if repo not found
- Wrap children in RepoProvider context

### Files to Create/Modify
- `web/app/(main)/[repo]/layout.tsx`
- `web/lib/contexts/RepoContext.tsx` (new)
## Acceptance
- [ ] TBD

## Done summary
- Created RepoContext.tsx with RepoProvider and useRepo hook
- Uses decodeRepoSlug to parse owner/name from URL
- Queries Convex getByOwnerAndName for validation
- Shows loading spinner while fetching
- Shows 404 message if repo not found
- Updated layout.tsx to use RepoProvider
## Evidence
- Commits:
- Tests:
- PRs: