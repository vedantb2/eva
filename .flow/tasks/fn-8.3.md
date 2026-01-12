# fn-8.3: Refactor Repos Setup Page - Extract interactive logic to client

## Goal
Convert `app/(main)/repos/setup/[id]/page.tsx` to have a server component shell with client logic extracted.

## Current State
Heavily interactive page with:
- `use(params)` for route params
- `useSearchParams` for query params
- `useState` for repos, loading, syncing, error, addedRepos
- `useEffect` for fetching repos
- `useMutation` for creating repos
- Multiple event handlers

## Approach
This page is almost entirely interactive. The server component can only provide:
- The route parameter extraction
- A minimal wrapper

### 1. Create `RepoSetupClient.tsx` (client component)
```tsx
"use client"

interface RepoSetupClientProps {
  installationId: string;
}

export function RepoSetupClient({ installationId }: RepoSetupClientProps) {
  // All the current logic moves here
}
```

### 2. Update `page.tsx` (server component)
```tsx
import { RepoSetupClient } from "./RepoSetupClient"

export default async function RepoSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return <RepoSetupClient installationId={id} />;
}
```

## Files to modify
- `web/app/(main)/repos/setup/[id]/page.tsx` - Server component with param extraction
- `web/app/(main)/repos/setup/[id]/RepoSetupClient.tsx` - Client component with all logic

## Acceptance Criteria
- [ ] Page renders correctly
- [ ] Auto-sync works
- [ ] Add/Add All buttons work
- [ ] Navigation works
- [ ] No "use client" in page.tsx
- [ ] TypeScript compiles without errors

## Note: Server Actions Integration
This task creates `RepoSetupClient.tsx`. Task fn-8.11 will create `actions.ts` with `fetchInstallationRepos()` Server Action.

**Recommended order**: Do fn-8.11 first or together with this task, so `RepoSetupClient.tsx` can use the Server Action directly instead of fetch.
