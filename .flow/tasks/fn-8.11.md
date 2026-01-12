# fn-8.11: Convert API fetch calls to Server Actions

## Goal
Replace client-side fetch calls to API routes with Server Actions. This removes the need for API route handlers and keeps server logic in `actions.ts` files.

## Current API Calls Found

### 1. Repos Sync - `repos/page.tsx`
```tsx
await fetch("/api/github/sync", { method: "POST" });
```

### 2. Fetch Installation Repos - `repos/setup/[id]/page.tsx`  
```tsx
fetch("/api/github/repos/" + installationId)
```

### 3. Create Branch - `lib/utils/github.ts`
```tsx
await fetch("/api/github/create-branch", { method: "POST", ... });
```

## Changes

### 1. Create `app/(main)/repos/actions.ts`
```tsx
"use server"

import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { getAppOctokit, listInstallationRepos } from "@/lib/github/client";

export async function syncGitHubRepos() {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });

  if (!token) {
    return { error: "Not authenticated", synced: 0 };
  }

  const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);

  const octokit = getAppOctokit();
  const installations = await octokit.rest.apps.listInstallations();

  let totalAdded = 0;
  for (const installation of installations.data) {
    const repos = await listInstallationRepos(installation.id);
    for (const repo of repos) {
      try {
        await convex.mutation(api.githubRepos.create, {
          owner: repo.owner,
          name: repo.name,
          installationId: installation.id,
        });
        totalAdded++;
      } catch {}
    }
  }

  return { synced: totalAdded };
}
```

### 2. Create `app/(main)/repos/setup/[id]/actions.ts`
```tsx
"use server"

import { listInstallationRepos } from "@/lib/github/client";

export async function fetchInstallationRepos(installationId: number) {
  try {
    const repos = await listInstallationRepos(installationId);
    return { repos, error: null };
  } catch (error) {
    return { 
      repos: [], 
      error: error instanceof Error ? error.message : "Failed to fetch repos" 
    };
  }
}
```

### 3. Create `lib/actions/github.ts` (for branch creation)
```tsx
"use server"

import { auth } from "@clerk/nextjs/server";
import { createBranch as createGitHubBranch } from "@/lib/github/client";

interface CreateBranchParams {
  owner: string;
  repo: string;
  branchName: string;
  baseBranch?: string;
}

export async function createBranch(params: CreateBranchParams) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Need to get installationId from repo - may need to query Convex
    const result = await createGitHubBranch({
      installationId: 0, // TODO: Get from repo
      ...params,
    });
    return { success: true, branch: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create branch" 
    };
  }
}
```

### 4. Update client components to use Server Actions

**ReposClient.tsx:**
```tsx
import { syncGitHubRepos } from "./actions";

const handleSync = async () => {
  setSyncing(true);
  try {
    const result = await syncGitHubRepos();
    // Handle result
  } catch (err) {
    console.error("Sync failed:", err);
  }
  setSyncing(false);
};
```

**RepoSetupClient.tsx:**
```tsx
import { fetchInstallationRepos } from "./actions";

useEffect(() => {
  fetchInstallationRepos(Number(installationId))
    .then((data) => {
      if (data.error) {
        setError(data.error);
      } else {
        setRepos(data.repos);
      }
      setLoading(false);
    });
}, [installationId]);
```

### 5. Delete unused API routes (optional, after testing)
- `app/api/github/sync/route.ts`
- `app/api/github/repos/[id]/route.ts`
- `app/api/github/create-branch/route.ts`

## Files to create
- `web/app/(main)/repos/actions.ts`
- `web/app/(main)/repos/setup/[id]/actions.ts`
- `web/lib/actions/github.ts`

## Files to modify
- `web/app/(main)/repos/ReposClient.tsx` (after fn-8.2)
- `web/app/(main)/repos/setup/[id]/RepoSetupClient.tsx` (after fn-8.3)
- `web/lib/utils/github.ts` - Update to use Server Action

## Files to potentially delete
- `web/app/api/github/sync/route.ts`
- `web/app/api/github/repos/[id]/route.ts`
- `web/app/api/github/create-branch/route.ts`

## Acceptance Criteria
- [ ] Sync repos uses Server Action
- [ ] Fetch installation repos uses Server Action
- [ ] Create branch uses Server Action
- [ ] No client-side fetch to /api/ routes (except chat which uses streaming)
- [ ] TypeScript compiles without errors
- [ ] All functionality works as before
