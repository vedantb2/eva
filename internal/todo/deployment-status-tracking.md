# Deployment Status Tracking for Quick Tasks

## Context

When Eva pushes code to a branch, Vercel (via its GitHub integration) automatically creates a GitHub Deployment. Currently, there's no visibility into whether that deployment succeeded or failed — users have to check Vercel manually. This adds deployment status tracking to the TaskDetailModal so users can see the build status and preview URL directly in the task card.

**Approach:** Use the **GitHub Deployments API** (not Vercel API). Vercel automatically creates GitHub Deployment records when it builds. We already have GitHub App tokens, so no new authentication is needed. This also works with any deployment provider, not just Vercel.

---

## Changes

### 1. Schema: Add deployment fields to `agentRuns`

**File:** `packages/backend/convex/schema.ts`

Add two optional fields to the `agentRuns` table:

```
deploymentStatus: v.optional(v.string())   // GitHub states: queued | pending | in_progress | success | error | failure
deploymentUrl: v.optional(v.string())      // Preview URL (e.g. project-git-branch.vercel.app)
```

Using `v.string()` (not a union validator) since these are GitHub API values that could expand.

### 2. Backend: Update agentRuns mutations/queries

**File:** `packages/backend/convex/agentRuns.ts`

- Update `agentRunValidator` to include the two new optional fields (so queries return them)
- Add new `updateDeployment` mutation:
  - Args: `{ id, deploymentStatus, deploymentUrl? }`
  - Same auth pattern as existing mutations (check board ownership)
  - Patches the agentRun record

### 3. New Inngest function: `track-deployment`

**File:** `apps/web/lib/inngest/functions/track-deployment.ts`

Listens for `deployment/track.requested` event. Steps:

1. **wait-for-deploy** — `sleep 20s` (give Vercel time to pick up the push)
2. **find-and-poll** — Loop up to 10 times (5 min total):
   - `GET /repos/{owner}/{repo}/deployments?ref={branch}&per_page=1` → find latest deployment
   - `GET /repos/{owner}/{repo}/deployments/{id}/statuses?per_page=1` → get current state
   - Update agentRun via `api.agentRuns.updateDeployment`
   - If terminal state (`success` / `error` / `failure`), stop polling
   - Otherwise `sleep 30s` and retry

Uses `getGitHubToken(installationId)` from `apps/web/lib/inngest/sandbox.ts` for auth (already exists).

### 4. Emit tracking event from execute-task

**File:** `apps/web/lib/inngest/functions/execute-task.ts`

After the existing `notify-completion` sendEvent, add:

```typescript
await step.sendEvent("request-deployment-tracking", {
  name: "deployment/track.requested",
  data: {
    runId,
    taskId,
    repoOwner: repo.owner,
    repoName: repo.name,
    branchName: sandboxData.branchName,
    installationId,
    clerkToken,
  },
});
```

### 5. Register the new function

**File:** `apps/web/lib/inngest/index.ts` — add `export { trackDeployment } from "./functions/track-deployment"`
**File:** `apps/web/app/api/inngest/route.ts` — add `trackDeployment` to the imports and `functions` array

### 6. UI: Show deployment status in TaskDetailModal

**File:** `apps/web/lib/components/tasks/TaskDetailModal.tsx`

**Sidebar (right column)** — Below the "Pull Request" section, add a "Deployment" section:

- Derive `latestDeployment` from the first run that has a `deploymentStatus`
- Show a color-coded badge: `success` → green, `in_progress`/`pending`/`queued` → blue animated, `error`/`failure` → red
- If `deploymentUrl` exists, show a "View Preview" link (opens in new tab)
- Use `IconRocket` from tabler icons

**Per-run accordion** — Inside each run's accordion content, if that run has `deploymentStatus`, show a small inline badge next to the PR link.

---

## Files Summary

| File                                                 | Change                                               |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `packages/backend/convex/schema.ts`                  | Add `deploymentStatus`, `deploymentUrl` to agentRuns |
| `packages/backend/convex/agentRuns.ts`               | Update validator + add `updateDeployment` mutation   |
| `apps/web/lib/inngest/functions/track-deployment.ts` | **New file** — polling Inngest function              |
| `apps/web/lib/inngest/functions/execute-task.ts`     | Emit `deployment/track.requested` event              |
| `apps/web/lib/inngest/index.ts`                      | Export new function                                  |
| `apps/web/app/api/inngest/route.ts`                  | Register new function                                |
| `apps/web/lib/components/tasks/TaskDetailModal.tsx`  | Show deployment status + preview URL                 |

## Verification

1. Run `npx tsc` in `apps/web/` to check types
2. Deploy Convex schema changes (`npx convex deploy` or dev server)
3. Create a quick task on a repo that has Vercel GitHub integration
4. Run Eva on the task — after it pushes code, verify:
   - The `deployment/track.requested` Inngest event fires (check Inngest dashboard)
   - The `track-deployment` function polls and finds the GitHub Deployment
   - The `agentRuns` record gets `deploymentStatus` and `deploymentUrl` updated
   - The TaskDetailModal shows the deployment badge and preview URL
