# fn-8.2: Refactor Repos Page - Extract list and sync to client

## Goal
Convert `app/(main)/repos/page.tsx` from a client component to a server component by extracting the interactive repo list into a client component.

## Current State
The entire page is "use client" with useQuery, useState for syncing.

## What needs client-side:
- `useQuery` for fetching repos
- `useState` for sync loading state
- Sync button onClick handler
- Connect/Add GitHub button (links are fine in server, but conditional rendering based on repos needs client)

## Changes

### 1. Create `ReposClient.tsx` (client component)
```tsx
"use client"
// Contains:
// - useQuery for repos
// - useState for syncing
// - handleSync function
// - The entire repos grid/empty state/loading UI
// - Sync button and Add Repos button
```

### 2. Update `page.tsx` (server component)
```tsx
import { ReposClient } from "./ReposClient"
import { PageHeader } from "@/lib/components/PageHeader"

export default function RepositoriesPage() {
  return (
    <>
      <PageHeader title="Repositories" />
      <ReposClient />
    </>
  )
}
```

Note: PageHeader might need to stay flexible - if it has interactive headerRight, that can be passed from client component.

Actually, looking at the current code, the header buttons are part of the dynamic content. The simplest approach is to have ReposClient render everything including the header buttons.

## Files to modify
- `web/app/(main)/repos/page.tsx` - Convert to server with minimal shell
- `web/app/(main)/repos/ReposClient.tsx` - New client component with all interactive logic

## Acceptance Criteria
- [ ] Page renders correctly
- [ ] Sync button works
- [ ] Add Repos/Connect GitHub button works
- [ ] Loading and empty states work
- [ ] No "use client" in page.tsx
- [ ] TypeScript compiles without errors

## Note: Server Actions Integration
This task creates `ReposClient.tsx`. Task fn-8.11 will create `actions.ts` with `syncGitHubRepos()` Server Action. 

**Recommended order**: Do fn-8.11 first or together with this task, so `ReposClient.tsx` can use the Server Action directly instead of fetch.
