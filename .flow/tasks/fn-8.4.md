# fn-8.4: Refactor Features Page - Extract features list to client

## Goal
Convert `app/(main)/[repo]/features/page.tsx` to a server component with client list.

## Current State
- Uses `useQuery` for features
- Uses `useRepo` context for repo data
- Renders feature cards with links

## Constraint
This page uses `useRepo()` which requires being inside RepoProvider (client context). The layout provides this context.

## Approach
Since the page needs `useRepo()`, it must be a client component OR we need to restructure.

**Option A**: Keep as client (not ideal but maintains current pattern)
**Option B**: Pass repo info as props from a client wrapper

Given the RepoContext pattern is used throughout, we'll create a client component that uses the context.

### 1. Create `FeaturesClient.tsx` (client component)
```tsx
"use client"

export function FeaturesClient() {
  const { repo, fullName } = useRepo();
  const features = useQuery(api.features.list, { repoId: repo._id });
  // ... rest of the rendering logic
}
```

### 2. Update `page.tsx` (server component)
```tsx
import { FeaturesClient } from "./FeaturesClient"

export default function FeaturesPage() {
  return <FeaturesClient />;
}
```

This is a minimal win - the page.tsx becomes a thin server wrapper. The benefit is establishing the pattern.

## Files to modify
- `web/app/(main)/[repo]/features/page.tsx` - Thin server wrapper
- `web/app/(main)/[repo]/features/FeaturesClient.tsx` - Client component

## Acceptance Criteria
- [ ] Page renders correctly
- [ ] Features list displays
- [ ] Links work
- [ ] No "use client" in page.tsx
- [ ] TypeScript compiles without errors
