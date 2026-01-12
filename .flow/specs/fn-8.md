# fn-8: Enforce Server/Client Component Boundaries

## Overview

Refactor the entire web codebase to properly separate Server and Client components in Next.js. The goal is to minimize client-side surface area while maintaining full functionality.

## Rules (Strict)

- Do NOT add "use client" unless required
- A component is Client only if it uses:
  - React hooks (useState, useEffect, useContext, etc.)
  - Convex hooks (useQuery, useMutation)
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs
  - Client-side routing hooks (useRouter, usePathname)
- Tailwind usage does NOT require client components
- Keep structure, layout, static UI in Server Components
- Server Components may import Client Components
- Client Components must never import Server Components

## Pattern

```tsx
// page.tsx (Server)
import FeedClient from "./FeedClient"

export default function Page() {
  return (
    <main>
      <h1>Feed</h1>
      <FeedClient />
    </main>
  )
}

// FeedClient.tsx
"use client"

export default function FeedClient() {
  // Convex + hooks live here
}
```

## Current State Analysis

### Pages with "use client" that need refactoring:

1. **`(landing)/page.tsx`** - Uses Clerk auth components (Authenticated, SignInButton, etc.)
   - Static content (headings, features, sections) can be server-side
   - Only auth-aware buttons need client component

2. **`repos/page.tsx`** - Uses useQuery, useState, event handlers
   - PageHeader structure can be server-side
   - Repo list with sync functionality needs client component

3. **`repos/setup/[id]/page.tsx`** - Heavily stateful with fetch, mutations
   - Most logic must stay client-side
   - Static container/shell could be server

4. **`[repo]/layout.tsx`** - Uses RepoProvider with useQuery
   - Must remain client due to context pattern
   
5. **`[repo]/plan/page.tsx`** - Uses useQuery, useState, useRepo
   - Static header structure can be server
   - Plan list and creation needs client

6. **`[repo]/features/page.tsx`** - Uses useQuery, useRepo
   - Static header can be server
   - Features list needs client

7. **`[repo]/quick-tasks/page.tsx`** - Uses useQuery, useState, useRepo
   - Static header can be server
   - Task list and modal needs client

8. **`[repo]/plan/[planId]/page.tsx`** - Uses useQuery, useState, useParams
   - Complex conversation UI - mostly client
   - Static shell could be server

9. **`[repo]/features/[featureId]/page.tsx`** - Uses useQuery, useRepo
   - Task list needs client
   - Static structure can be server

### Key Constraint: RepoContext

The `[repo]/*` pages depend on `useRepo()` hook from RepoContext. The RepoProvider uses Convex's useQuery to fetch repo data. This creates a client boundary at the layout level.

**Approach**: Accept that `[repo]/layout.tsx` must be client due to RepoProvider. Focus on extracting static shells where beneficial.

## Tasks

### Task 1: Refactor Landing Page
Extract auth-dependent components to `LandingAuthClient.tsx`, keep static content in server page.

### Task 2: Refactor Repos Page
Extract repo list and sync to `ReposListClient.tsx`, keep static structure in server page.

### Task 3: Refactor Repos Setup Page
Extract interactive logic to `RepoSetupClient.tsx`, keep minimal shell in server page.

### Task 4: Refactor Features Page
Extract features list to `FeaturesListClient.tsx`, keep static header in server page.

### Task 5: Refactor Quick Tasks Page
Extract task list and modal to `QuickTasksClient.tsx`, keep static header in server page.

### Task 6: Refactor Plan Page
Extract plan list and creation to `PlansListClient.tsx`, keep static header in server page.

### Task 7: Refactor Plan Detail Page
Extract conversation and finalization to `PlanDetailClient.tsx`, keep minimal shell in server.

### Task 8: Refactor Feature Detail Page
Extract task list to `FeatureDetailClient.tsx`, keep static structure in server page.

### Task 9: Make PageHeader a Server Component
Remove useRouter/usePathname, pass navigation as render props or make back button a client component.

### Task 10: Verify TypeScript and test all pages
Run `npx tsc` and manually test all pages work correctly after refactoring.

### Task 11: Convert API fetch calls to Server Actions
Replace client-side `fetch()` calls to API routes with Server Actions in `actions.ts` files:
- `repos/actions.ts` - `syncGitHubRepos()`
- `repos/setup/[id]/actions.ts` - `fetchInstallationRepos()`
- `lib/actions/github.ts` - `createBranch()`

## Server Actions Pattern

Instead of client-side fetch to API routes:
```tsx
// OLD - Client-side fetch
const handleSync = async () => {
  await fetch("/api/github/sync", { method: "POST" });
};
```

Use Server Actions:
```tsx
// actions.ts
"use server"

export async function syncGitHubRepos() {
  // Server-side logic here
  return { synced: count };
}

// Client component
import { syncGitHubRepos } from "./actions";

const handleSync = async () => {
  const result = await syncGitHubRepos();
};
```

Benefits:
- No need for API route handlers
- Type-safe function calls
- Automatic request/response handling
- Can be called from Client Components or forms
